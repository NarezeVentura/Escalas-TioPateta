import sqlite3
from werkzeug.security import generate_password_hash

DB_PATH = "escala.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()

    #USUÁRIOS DA EMPRESA
    c.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nome        TEXT    NOT NULL,
            email       TEXT    NOT NULL UNIQUE,
            senha_hash  TEXT    NOT NULL,
            role        TEXT    NOT NULL DEFAULT 'funcionario',
            criado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    #REGISTRO DE ESCALAS
    c.execute("""
        CREATE TABLE IF NOT EXISTS escalas (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_festa      TEXT    NOT NULL,
            local_nome      TEXT    NOT NULL,
            local_endereco  TEXT    NOT NULL,
            data_festa      TEXT    NOT NULL,
            horario_inicio  TEXT    NOT NULL,
            horario_fim     TEXT    NOT NULL,
            duracao_horas   REAL    NOT NULL,
            produto         TEXT    NOT NULL,
            atracoes        TEXT,
            total_vagas     INTEGER NOT NULL DEFAULT 2,
            status          TEXT    NOT NULL DEFAULT 'aberta',
            criado_em       TEXT    NOT NULL DEFAULT (datetime('now')),
            atualizado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    #VAGAS DA ESCALA PARA OS FUNCIONARIOS 
    #Cada linha significa uma bolha no frontend.
    #usuario_id NULL é uma vaga aberta | preenchido = funcionário escalado.
    c.execute("""
        CREATE TABLE IF NOT EXISTS escala_vagas (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            escala_id     INTEGER NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
            usuario_id    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
            confirmado_em TEXT    DEFAULT NULL
        )
    """)

    #FERRAMENTAS DE TRABALHO
    c.execute("""
        CREATE TABLE IF NOT EXISTS ferramentas (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            nome             TEXT    NOT NULL UNIQUE,
            descricao        TEXT,
            quantidade_total INTEGER NOT NULL DEFAULT 0,
            criado_em        TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    #FERRAMENTAS ESCALADAS (PARA VER QUANTAS TEM, QUEM PEGOU E ETC)
    c.execute("""
        CREATE TABLE IF NOT EXISTS escala_ferramentas (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            escala_id        INTEGER NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
            ferramenta_id    INTEGER NOT NULL REFERENCES ferramentas(id),
            quantidade_usada INTEGER NOT NULL DEFAULT 1,
            coletado_por     INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
            coletado_em      TEXT    DEFAULT NULL,
            devolvido_em     TEXT    DEFAULT NULL,
            UNIQUE(escala_id, ferramenta_id)
        )
    """)

    conn.commit()
    
    # Criar admin inicial se não existir
    criar_admin_inicial(conn)
    
    conn.close()
    print("Banco de dados inicializado.")


def criar_admin_inicial(conn):
    """Criar o primeiro administrador se não existir"""
    c = conn.cursor()
    
    email_admin = "viniventuras@yahoo.com"
    
    # Verificar se o admin já existe
    c.execute("SELECT id FROM usuarios WHERE email = ?", (email_admin,))
    if c.fetchone():
        return  # Admin já existe, não fazer nada
    
    # Dados do admin
    nome = "Tio Pateta"
    senha = "TioPatet@1234"
    
    # Criar hash da senha
    senha_hash = generate_password_hash(senha)
    
    # Inserir admin
    c.execute("""
        INSERT INTO usuarios (nome, email, senha_hash, role)
        VALUES (?, ?, ?, ?)
    """, (nome, email_admin, senha_hash, 'admin'))
    
    conn.commit()
    print("Administrador inicial criado!")
    print(f"Email: {email_admin}")
    print(f"Senha: {senha}")
