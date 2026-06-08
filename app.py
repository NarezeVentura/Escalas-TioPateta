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
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=15)

jwt = JWTManager(app)


# HELPERS - PERMISSÕES     


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
    
#AUTENTICAÇÃO

@app.route('/api/auth/registro', methods=['POST'])
@role_required('admin')
def registro():
    """Registrar novo usuário (APENAS ADMIN pode registrar)"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('senha') or not data.get('nome'):
        return {"msg": "Email, senha e nome são obrigatórios"}, 400
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        senha_hash = generate_password_hash(data['senha'])
        role = data.get('role', 'funcionario')  # Default é o funcionário
        
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
            "nome": data['nome'],
            "email": data['email'],
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

# GESTÃO DE USUÁRIOS - CRIAÇÃO, EDIÇÃO E EXCLUSÃO 

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



# GESTÃO DAS ESCALAS - ADICIONAR, EDITAR E EXCLUIR 

@app.route('/api/escalas', methods=['POST'])
@role_required('admin')
def criar_escala():
    """Criar nova escala (admin only)"""
    data = request.get_json()
    
    campos_obrigatorios = ['nome_festa', 'local_nome', 'local_endereco', 'data_festa',
                          'horario_inicio', 'horario_fim', 'duracao_horas', 'produto', 'total_vagas']
    
    if not all(campo in data for campo in campos_obrigatorios):
        return {"msg": f"Campos obrigatórios: {', '.join(campos_obrigatorios)}"}, 400
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        c.execute("""
            INSERT INTO escalas 
            (nome_festa, local_nome, local_endereco, data_festa, horario_inicio, 
             horario_fim, duracao_horas, produto, atracoes, total_vagas, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['nome_festa'],
            data['local_nome'],
            data['local_endereco'],
            data['data_festa'],
            data['horario_inicio'],
            data['horario_fim'],
            data['duracao_horas'],
            data['produto'],
            data.get('atracoes', ''),
            data['total_vagas'],
            'aberta'
        ))
        
        escala_id = c.lastrowid
        
        # Criar vagas vazias para a escala
        for i in range(data['total_vagas']):
            c.execute("INSERT INTO escala_vagas (escala_id) VALUES (?)", (escala_id,))
        
        conn.commit()
        conn.close()
        
        return {"msg": "Escala criada com sucesso", "escala_id": escala_id}, 201
    
    except Exception as e:
        return {"msg": f"Erro ao criar escala: {str(e)}"}, 500

@app.route('/api/escalas', methods=['GET'])
@jwt_required()
def listar_escalas():
    """Listar escalas com filtros opcionais"""
    try:
        status = request.args.get('status', None)
        futuras_apenas = request.args.get('futuras', 'true').lower() == 'true'
        
        conn = get_connection()
        c = conn.cursor()
        
        query = "SELECT * FROM escalas WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if futuras_apenas:
            query += " AND data_festa >= date('now')"
        
        query += " ORDER BY data_festa DESC"
        
        c.execute(query, params)
        escalas = [dict(row) for row in c.fetchall()]
        conn.close()
        
        return {"escalas": escalas}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao listar escalas: {str(e)}"}, 500

@app.route('/api/escalas/<int:escala_id>', methods=['GET'])
@jwt_required()
def obter_escala(escala_id):
    """Obter detalhes completos de uma escala"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Dados da escala
        c.execute("SELECT * FROM escalas WHERE id = ?", (escala_id,))
        escala = c.fetchone()
        
        if not escala:
            conn.close()
            return {"msg": "Escala não encontrada"}, 404
        
        # Vagas da escala com info dos funcionários
        c.execute("""
            SELECT ev.id as vaga_id, ev.usuario_id, ev.confirmado_em, 
                   u.nome, u.email, u.role
            FROM escala_vagas ev
            LEFT JOIN usuarios u ON ev.usuario_id = u.id
            WHERE ev.escala_id = ?
            ORDER BY ev.id
        """, (escala_id,))
        vagas = [dict(row) for row in c.fetchall()]
        
        conn.close()
        
        return {
            **dict(escala),
            "vagas": vagas,
            "vagas_preenchidas": sum(1 for v in vagas if v['usuario_id'] is not None),
            "vagas_disponiveis": sum(1 for v in vagas if v['usuario_id'] is None)
        }, 200
    
    except Exception as e:
        return {"msg": f"Erro ao obter escala: {str(e)}"}, 500

@app.route('/api/escalas/<int:escala_id>', methods=['PUT'])
@role_required('admin')
def atualizar_escala(escala_id):
    """Atualizar escala (admin only)"""
    data = request.get_json()
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Verificar se a escala existe
        c.execute("SELECT total_vagas FROM escalas WHERE id = ?", (escala_id,))
        escala = c.fetchone()
        if not escala:
            conn.close()
            return {"msg": "Escala não encontrada"}, 404
        
        updates = []
        params = []
        
        campos_permitidos = ['nome_festa', 'local_nome', 'local_endereco', 'data_festa',
                            'horario_inicio', 'horario_fim', 'duracao_horas', 'produto',
                            'atracoes', 'status']
        
        for campo in campos_permitidos:
            if campo in data:
                updates.append(f"{campo} = ?")
                params.append(data[campo])
        
        # Se mudar total_vagas, adicionar/remover vagas
        if 'total_vagas' in data:
            novo_total = data['total_vagas']
            vagas_atuais = escala['total_vagas']
            
            if novo_total > vagas_atuais:
                # Adicionar vagas
                for i in range(novo_total - vagas_atuais):
                    c.execute("INSERT INTO escala_vagas (escala_id) VALUES (?)", (escala_id,))
            elif novo_total < vagas_atuais:
                # Remover vagas (apenas as vazias do final)
                c.execute("""
                    DELETE FROM escala_vagas 
                    WHERE escala_id = ? AND usuario_id IS NULL 
                    LIMIT ?
                """, (escala_id, vagas_atuais - novo_total))
            
            updates.append("total_vagas = ?")
            params.append(novo_total)
        
        if not updates:
            conn.close()
            return {"msg": "Nenhum campo para atualizar"}, 400
        
        updates.append("atualizado_em = ?")
        params.append(datetime.now().isoformat())
        params.append(escala_id)
        
        c.execute(f"UPDATE escalas SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
        conn.close()
        
        return {"msg": "Escala atualizada com sucesso"}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao atualizar escala: {str(e)}"}, 500

@app.route('/api/escalas/<int:escala_id>', methods=['DELETE'])
@role_required('admin')
def deletar_escala(escala_id):
    """Deletar escala (admin only)"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        c.execute("DELETE FROM escalas WHERE id = ?", (escala_id,))
        conn.commit()
        conn.close()
        
        return {"msg": "Escala deletada com sucesso"}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao deletar escala: {str(e)}"}, 500



# AUTO ESCALAÇÃO DOS FUNCIONÁRIos

@app.route('/api/escalas/<int:escala_id>/inscrever', methods=['POST'])
@jwt_required()
def funcionario_se_inscrever(escala_id):
    """Funcionário se escalar em uma escala"""
    user_id = get_jwt_identity()
    user = get_current_user()
    
    # Apenas funcionários podem se inscrever
    if user['role'] != 'funcionario':
        return {"msg": "Apenas funcionários podem se inscrever"}, 403
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Verificar se a escala existe e está aberta
        c.execute("SELECT id, status FROM escalas WHERE id = ?", (escala_id,))
        escala = c.fetchone()
        
        if not escala:
            conn.close()
            return {"msg": "Escala não encontrada"}, 404
        
        if escala['status'] != 'aberta':
            conn.close()
            return {"msg": "Escala não está aberta para inscrições"}, 409
        
        # Verificar se já está inscrito
        c.execute("""
            SELECT id FROM escala_vagas 
            WHERE escala_id = ? AND usuario_id = ?
        """, (escala_id, user_id))
        
        if c.fetchone():
            conn.close()
            return {"msg": "Você já está inscrito nesta escala"}, 409
        
        # Encontrar primeira vaga disponível
        c.execute("""
            SELECT id FROM escala_vagas 
            WHERE escala_id = ? AND usuario_id IS NULL
            LIMIT 1
        """, (escala_id,))
        
        vaga = c.fetchone()
        
        if not vaga:
            conn.close()
            return {"msg": "Não há vagas disponíveis nesta escala"}, 409
        
        # Atribuir funcionário à vaga
        c.execute("""
            UPDATE escala_vagas 
            SET usuario_id = ?, confirmado_em = ? 
            WHERE id = ?
        """, (user_id, datetime.now().isoformat(), vaga['id']))
        
        conn.commit()
        conn.close()
        
        return {"msg": "Inscrito com sucesso na escala", "vaga_id": vaga['id']}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao se inscrever: {str(e)}"}, 500

@app.route('/api/escalas/<int:escala_id>/cancelar-inscricao', methods=['POST'])
@jwt_required()
def funcionario_cancelar_inscricao(escala_id):
    """Funcionário cancelar sua inscrição em uma escala"""
    user_id = get_jwt_identity()
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Encontrar a vaga do funcionário nesta escala
        c.execute("""
            SELECT id FROM escala_vagas 
            WHERE escala_id = ? AND usuario_id = ?
        """, (escala_id, user_id))
        
        vaga = c.fetchone()
        
        if not vaga:
            conn.close()
            return {"msg": "Você não está inscrito nesta escala"}, 404
        
        # Remover funcionário da vaga
        c.execute("""
            UPDATE escala_vagas 
            SET usuario_id = NULL, confirmado_em = NULL 
            WHERE id = ?
        """, (vaga['id'],))
        
        conn.commit()
        conn.close()
        
        return {"msg": "Inscrição cancelada com sucesso"}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao cancelar inscrição: {str(e)}"}, 500

@app.route('/api/escalas/<int:escala_id>/vagas', methods=['GET'])
@jwt_required()
def listar_vagas_escala(escala_id):
    """Listar todas as vagas de uma escala"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        c.execute("""
            SELECT ev.id, ev.usuario_id, ev.confirmado_em, 
                   u.nome, u.email
            FROM escala_vagas ev
            LEFT JOIN usuarios u ON ev.usuario_id = u.id
            WHERE ev.escala_id = ?
            ORDER BY ev.id
        """, (escala_id,))
        
        vagas = [dict(row) for row in c.fetchall()]
        conn.close()
        
        return {"vagas": vagas}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao listar vagas: {str(e)}"}, 500

@app.route('/api/escalas/<int:escala_id>/vagas/<int:vaga_id>/atribuir', methods=['POST'])
@role_required('admin')
def admin_atribuir_vaga(escala_id, vaga_id):
    """Admin atribuir funcionário a uma vaga manualmente"""
    data = request.get_json()
    
    if 'usuario_id' not in data:
        return {"msg": "usuario_id é obrigatório"}, 400
    
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Verificar se a vaga existe
        c.execute("""
            SELECT id FROM escala_vagas 
            WHERE id = ? AND escala_id = ?
        """, (vaga_id, escala_id))
        
        if not c.fetchone():
            conn.close()
            return {"msg": "Vaga não encontrada"}, 404
        
        # Atribuir funcionário
        c.execute("""
            UPDATE escala_vagas 
            SET usuario_id = ?, confirmado_em = ? 
            WHERE id = ?
        """, (data['usuario_id'], datetime.now().isoformat(), vaga_id))
        
        conn.commit()
        conn.close()
        
        return {"msg": "Funcionário atribuído com sucesso"}, 200
    
    except Exception as e:
        return {"msg": f"Erro ao atribuir vaga: {str(e)}"}, 500



# LIMPEZA AUTOMÁTICA (cada 30 DIAS)


@app.route('/api/admin/limpeza-automatica', methods=['POST'])
@role_required('admin')
def executar_limpeza_automatica():
    """Executar limpeza de escalas com mais de 30 dias (admin only)"""
    try:
        conn = get_connection()
        c = conn.cursor()
        
        # Calcular data limite (30 dias atrás)
        data_limite = (datetime.now() - timedelta(days=30)).date().isoformat()
        
        # Encontrar escalas antigas
        c.execute("""
            SELECT id FROM escalas 
            WHERE data_festa < ?
        """, (data_limite,))
        
        escalas_antigas = [row['id'] for row in c.fetchall()]
        
        # Deletar vagas e escalas antigas
        for escala_id in escalas_antigas:
            c.execute("DELETE FROM escala_vagas WHERE escala_id = ?", (escala_id,))
            c.execute("DELETE FROM escalas WHERE id = ?", (escala_id,))
        
        conn.commit()
        conn.close()
        
        return {
            "msg": "Limpeza automática executada com sucesso",
            "escalas_removidas": len(escalas_antigas),
            "data_limite": data_limite
        }, 200
    
    except Exception as e:
        return {"msg": f"Erro ao executar limpeza: {str(e)}"}, 500

# INFORMAÇÕES DE ERROS

@app.errorhandler(404)
def nao_encontrado(error):
    return {"msg": "Rota não encontrada"}, 404

@app.errorhandler(405)
def metodo_nao_permitido(error):
    return {"msg": "Método não permitido"}, 405

@app.errorhandler(500)
def erro_interno(error):
    return {"msg": "Erro interno do servidor"}, 500


# INICIALIZAÇÃO

if __name__ == '__main__':
    init_db()
    print("Banco de dados inicializado")
    print("Iniciando o servidor Flask...")
    app.run(debug=True, host='0.0.0.0', port=5000)
