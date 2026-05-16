-- Script SQL para o Banco de Dados do Projeto Senac Motirõ (PostgreSQL)
-- Este script contém as definições das tabelas para Usuários, Eventos e Inscrições.

-- Nota: No PostgreSQL, a criação de banco de dados e a troca de contexto (USE) 
-- geralmente são feitas via comandos do terminal (createdb) ou ferramentas de gerenciamento.
-- CREATE DATABASE senac_motiron;

-- 0. Definição de Tipos Customizados (Enums)
CREATE TYPE tipo_usuario AS ENUM ('gestor', 'aluno');
CREATE TYPE categoria_evento AS ENUM ('Workshop', 'Palestra', 'Networking', 'Conferência');
CREATE TYPE status_inscricao AS ENUM ('Confirmado', 'Pendente', 'Cancelado', 'Concluído');
CREATE TYPE presenca_inscricao AS ENUM ('Pendente', 'Presente');

-- 1. Tabela de Usuário
-- Armazena informações tanto de gestores quanto de alunos.
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, -- Em produção, armazenar o hash da senha
    tipo tipo_usuario NOT NULL DEFAULT 'aluno',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Evento (Atividades)
-- Armazena os detalhes dos workshops, palestras e conferências.
CREATE TABLE evento (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    horario TIME NOT NULL,
    local_evento VARCHAR(200),
    categoria categoria_evento NOT NULL,
    imagem_url VARCHAR(255),
    palestrante VARCHAR(100),
    vagas_totais INT NOT NULL,
    vagas_disponiveis INT NOT NULL,
    quantidade_horas INT DEFAULT 0,
    esta_cancelado BOOLEAN DEFAULT FALSE,
    esta_concluido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Inscrição
-- Relaciona usuários aos eventos e controla o status da participação.
CREATE TABLE inscricao (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    evento_id INT NOT NULL,
    status status_inscricao NOT NULL DEFAULT 'Confirmado',
    presenca presenca_inscricao NOT NULL DEFAULT 'Pendente',
    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves Estrangeiras
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    
    -- Garante que um usuário não se inscreva mais de uma vez no mesmo evento
    CONSTRAINT unique_user_event UNIQUE (usuario_id, evento_id)
);

-- Inserção de dados iniciais para teste (Seed Data)

-- Inserindo Usuário Padrão
INSERT INTO usuario (matricula, nome, email, senha, tipo) VALUES 
('gestor', 'Administrador Senac', 'gestor@senac.com.br', '1234', 'gestor'),
('aluno', 'Estudante Exemplo', 'aluno@email.com', '1234', 'aluno'),
('chicout', 'Felipe Chicout', 'chicout@email.com', '1234', 'aluno'),
('sonia', 'Sonia Blade', 'sonia@email.com', '1234', 'aluno'),
('joao', 'João Silva', 'joao@email.com', '1234', 'aluno'),
('maria', 'Maria Souza', 'maria@email.com', '1234', 'aluno'),
('pedro', 'Pedro Santos', 'pedro@email.com', '1234', 'aluno'),
('ana', 'Ana Oliveira', 'ana@email.com', '1234', 'aluno');

-- Inserindo Evento Iniciais
INSERT INTO evento (titulo, descricao, data_evento, horario, local_evento, categoria, imagem_url, palestrante, vagas_totais, vagas_disponiveis, quantidade_horas) VALUES
('Inovação Digital 2026', 'Explorando as tendências que moldarão o futuro dos negócios digitais.', '2026-05-15', '09:00:00', 'Auditório Central, São Paulo', 'Conferência', 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=800', 'Vários Palestrantes', 200, 195, 4),
('Workshop de Liderança Criativa', 'Desenvolva habilidades de liderança para o novo mercado corporativo.', '2026-05-22', '14:00:00', 'Espaço Coworking, Rio de Janeiro', 'Workshop', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800', 'Maria Oliveira', 50, 45, 8),
('Café com Networking', 'Conecte-se com CEOs e diretores das maiores empresas da América Latina.', '2026-06-05', '08:30:00', 'Hotel Fasano, Belo Horizonte', 'Networking', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800', 'Comunidade Executiva', 100, 95, 2);

-- Inserindo Inscrição Iniciais (Populando a lista de participantes)
-- Nota: IDs assumindo que as tabelas foram criadas do zero
INSERT INTO inscricao (usuario_id, evento_id, status, presenca) VALUES
(2, 1, 'Confirmado', 'Pendente'),
(3, 1, 'Confirmado', 'Presente'),
(4, 1, 'Confirmado', 'Pendente'),
(5, 2, 'Confirmado', 'Pendente'),
(6, 2, 'Confirmado', 'Presente'),
(7, 3, 'Confirmado', 'Pendente'),
(8, 3, 'Confirmado', 'Presente'),
(9, 1, 'Confirmado', 'Pendente'),
(10, 3, 'Confirmado', 'Pendente');
