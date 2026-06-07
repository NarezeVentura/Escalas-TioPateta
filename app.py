from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import sqlite3
from functools import wraps
from database import init_db, get_connection

app = Flask(__name__)

# Configurações
app.config['JWT_SECRET_KEY'] = 'sua-chave-secreta-super-segura-mude-isso-em-producao'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

jwt = JWTManager(app)

# ═════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def role_required(role):
    """Decorator para verificar permissão de role"""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            conn = get_connection()
            c = conn.cursor()
            c.execute("SELECT role FROM usuarios WHERE id = ?", (user_id,))
            user = c.fetchone()
            conn.close()
            
            if not user or user['role'] != role:
                return {"msg": "Acesso negado. Permissão insuficiente."}, 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user():
    """Obtém o usuário atual da sessão JWT"""
    user_id = get_jwt_identity()
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

# ═════════════════════════════════════════════════════════════════════════════
# AUTENTICAÇÃO
# ═════════════════════════════════════════════════════════════════════════════

@app.route('/api/auth/registro', methods=['POST'])
def registro():
    """Registrar novo usuário (apenas admin pode registrar outros usuários)"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('senha') or not data.get('nome'):
        return {"msg": "Email, senha e nome são obrigatórios"}, 400
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        senha_hash = generate_password_hash(data['senha'])
        role = data.get('role', 'funcionario')
        
        c.execute("""
            INSERT INTO usuarios (nome, email, senha_hash, role)
            VALUES (?, ?, ?, ?)
        """, (data['nome'], data['email'], senha_hash, role))
        
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        
        return {
            "msg": "Usuário registrado com sucesso",
            "user_id": user_id,
            "role": role
        }, 201
    
    except sqlite3.IntegrityError:
        return {"msg": "Email já registrado"}, 409
    except Exception as e:
        return {"msg": f"Erro ao registrar: {str(e)}"}, 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login de usuário"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('senha'):
        return {"msg": "Email e senha são obrigatórios"}, 400
    
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT id, email, nome, senha_hash, role FROM usuarios WHERE email = ?", (data['email'],))
        user = c.fetchone()
        conn.close()
        
        if not user or not check_password_hash(user['senha_hash'], data['senha']):
            return {"msg": "Email ou senha incorretos"}, 401
        
        access_token = create_access_token(identity=user['id'])
        
        return {
            "access_token": access_token,
            "user": {
                "id": user['id'],
                "nome": user['nome'],
                "email": user['email'],
                "role": user['role']
            }
        }, 200
    
    except Exception as e:
        return {"msg": f"Erro ao fazer login: {str(e)}"}, 500

# ═════════════════════════════════════════════════════════════════════════════
# GESTÃO DE USUÁRIOS
# ═════════════════════════════════════════════════════════════════════════════

@app.route('/api/usuarios/me', methods=['GET'])
@jwt_required()
def get_current_user_data():
    """Obter dados do usuário atual"""
    user = get_current_user()
    if not user:
        return {"msg": "Usuário não encontrado"}, 404
    
    user.pop('senha_hash', None)
    return user, 200

@app.route('/api/usuarios', methods=['GET'])
@role_required('admin')
def listar_usuarios():
    """Listar todos os usuários (admin only)"""
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT id, nome, email, role, criado_em FROM usuarios ORDER BY criado_em DESC")
        usuarios = [dict(row) for row in c.fetchall()]
        conn.close()
        
        return {"usuarios": usuarios}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao listar usuários: {str(e)}"}, 500

@app.route('/api/usuarios/<int:user_id>', methods=['GET'])
@jwt_required()
def obter_usuario(user_id):
    """Obter dados de um usuário específico"""
    user = get_current_user()
    
    # Apenas admin ou o próprio usuário pode visualizar
    if user['role'] != 'admin' and user['id'] != user_id:
        return {"msg": "Acesso negado"}, 403
    
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT id, nome, email, role, criado_em FROM usuarios WHERE id = ?", (user_id,))
        user_data = c.fetchone()
        conn.close()
        
        if not user_data:
            return {"msg": "Usuário não encontrado"}, 404
        
        return dict(user_data), 200
    
    except Exception as e:
        return {"msg": f"Erro ao obter usuário: {str(e)}"}, 500

@app.route('/api/usuarios/<int:user_id>', methods=['PUT'])
@jwt_required()
def atualizar_usuario(user_id):
    """Atualizar dados do usuário"""
    user = get_current_user()
    
    # Apenas admin ou o próprio usuário pode atualizar
    if user['role'] != 'admin' and user['id'] != user_id:
        return {"msg": "Acesso negado"}, 403
    
    data = request.get_json()
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        updates = []
        params = []
        
        if 'nome' in data:
            updates.append("nome = ?")
            params.append(data['nome'])
        
        if 'email' in data:
            updates.append("email = ?")
            params.append(data['email'])
        
        if not updates:
            conn.close()
            return {"msg": "Nenhum campo para atualizar"}, 400
        
        params.append(user_id)
        
        c.execute(f"UPDATE usuarios SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
        conn.close()
        
        return {"msg": "Usuário atualizado com sucesso"}, 200
    
    except sqlite3.IntegrityError:
        return {"msg": "Email já registrado"}, 409
    except Exception as e:
        return {"msg": f"Erro ao atualizar usuário: {str(e)}"}, 500

@app.route('/api/usuarios/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def deletar_usuario(user_id):
    """Deletar usuário (admin only)"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        c.execute("DELETE FROM usuarios WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        
        return {"msg": "Usuário deletado com sucesso"}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao deletar usuário: {str(e)}"}, 500


# ═════════════════════════════════════════════════════════════════════════════
# INICIALIZAÇÃO
# ═════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    init_db()
    print("✅ Banco de dados inicializado")
    print("🚀 Iniciando servidor Flask...")
    app.run(debug=True, host='0.0.0.0', port=5000)
