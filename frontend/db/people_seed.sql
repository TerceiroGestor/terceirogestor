-- Seed data for People module (PostgreSQL)

-- People
INSERT INTO people (id, avatar, full_name, social_name, email, phone, website, gender, marital_status, birth_date, nationality, cpf, rg, nis, notes, profile_summary, favorite_color, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'https://i.pravatar.cc/120?img=12', 'Ana Luiza Campos', 'Ana Campos', 'ana.campos@exemplo.com', '+55 11 98888-1212', 'https://anacampos.dev', 'Feminino', 'Solteira', '1994-03-12', 'Brasileira', '12345678909', '44556677-1', '123.45678.90-1', 'Responsavel pelo sustento principal da familia.', '<p>Perfil socioeconomico estavel, com renda complementar.</p>', '#4f46e5', 'Ativo'),
  ('00000000-0000-0000-0000-000000000002', 'https://i.pravatar.cc/120?img=32', 'Bruno Ferreira', 'Bruno', 'bruno.ferreira@exemplo.com', '+55 21 97777-2233', 'https://bf-portfolio.com', 'Masculino', 'Casado', '1988-11-08', 'Brasileira', '98765432100', '11223344-5', '321.65498.76-0', 'Renda varia conforme projetos.', '<p>Trabalha como prestador de servicos e possui renda variavel.</p>', '#0ea5e9', 'Ativo'),
  ('00000000-0000-0000-0000-000000000003', 'https://i.pravatar.cc/120?img=48', 'Carla Nogueira', 'Carla', 'carla.nogueira@exemplo.com', '+55 31 96666-8899', 'https://carlanogueira.me', 'Feminino', 'Divorciada', '1979-07-27', 'Brasileira', '55667788990', '99887766-4', '987.65432.10-9', 'Busca recolocacao profissional.', '<p>Atualmente em processo de transicao profissional.</p>', '#10b981', 'Em analise');

-- Contacts
INSERT INTO contacts (id, person_id, name, relationship, phone, email, is_primary)
VALUES
  ('11111111-1111-1111-1111-111111111001', '00000000-0000-0000-0000-000000000001', 'Lucas Campos', 'Responsavel', '+55 11 97777-8888', 'lucas.campos@exemplo.com', true),
  ('11111111-1111-1111-1111-111111111002', '00000000-0000-0000-0000-000000000002', 'Marina Ferreira', 'Familiar', '+55 21 98888-1111', 'marina.ferreira@exemplo.com', true),
  ('11111111-1111-1111-1111-111111111003', '00000000-0000-0000-0000-000000000002', 'Julia Souza', 'Emergencia', '+55 21 93333-2222', NULL, false);

-- Addresses
INSERT INTO addresses (id, person_id, label, zip, street, number, complement, neighborhood, city, state, country, is_primary)
VALUES
  ('22222222-2222-2222-2222-222222222001', '00000000-0000-0000-0000-000000000001', 'Residencial', '04567-010', 'Rua das Acacias', '245', 'Apto 41', 'Jardim Azul', 'Sao Paulo', 'SP', 'Brasil', true),
  ('22222222-2222-2222-2222-222222222002', '00000000-0000-0000-0000-000000000002', 'Residencial', '20040-020', 'Av. Central', '900', 'Casa', 'Centro', 'Rio de Janeiro', 'RJ', 'Brasil', true),
  ('22222222-2222-2222-2222-222222222003', '00000000-0000-0000-0000-000000000003', 'Residencial', '30110-011', 'Rua do Sol', '55', 'Bloco B', 'Savassi', 'Belo Horizonte', 'MG', 'Brasil', true);

-- Attendances
INSERT INTO attendances (id, person_id, title, summary, date, type, staff_name, notes_html)
VALUES
  ('33333333-3333-3333-3333-333333333001', '00000000-0000-0000-0000-000000000001', 'Entrevista inicial', 'Levantamento do contexto familiar e necessidades imediatas.', '2025-10-12', 'Social', 'Marina Oliveira', '<p>Realizada entrevista inicial com foco em renda e moradia. Familia relatou dificuldade em manter despesas mensais.</p>'),
  ('33333333-3333-3333-3333-333333333002', '00000000-0000-0000-0000-000000000001', 'Acompanhamento social', 'Atualizacao do plano de acompanhamento e beneficios.', '2025-11-25', 'Familiar', 'Carlos Menezes', '<p>Atualizamos o cadastro e registramos novos beneficios solicitados. Proximo retorno em 30 dias.</p>');

-- Diaries
INSERT INTO diaries (id, person_id, title, summary, date, notes_html)
VALUES
  ('44444444-4444-4444-4444-444444444001', '00000000-0000-0000-0000-000000000001', 'Contato telefonico', 'Relatou dificuldade de comparecer ao atendimento.', '2025-11-02', '<p>Telefonei para confirmar presenca. Informou que estava sem transporte.</p>');

-- Occurrences + actions
INSERT INTO occurrences (id, person_id, title, type, status, date, summary, initial_report_html, progress_notes_html, resolution_html)
VALUES
  ('55555555-5555-5555-5555-555555555001', '00000000-0000-0000-0000-000000000001', 'Conflito familiar', 'Convivencia', 'Em andamento', '2025-11-18', 'Relato de conflito entre responsavel e adolescente.', '<p>Familia informou discussao frequente e necessidade de orientacao.</p>', '<p>Realizada primeira reuniao. Familia aceitou acompanhamento.</p>', '');

INSERT INTO occurrence_actions (occurrence_id, description)
VALUES
  ('55555555-5555-5555-5555-555555555001', 'Reuniao com a familia'),
  ('55555555-5555-5555-5555-555555555001', 'Encaminhamento para apoio psicologico');

-- Presences
INSERT INTO presences (id, person_id, date, status)
VALUES
  ('66666666-6666-6666-6666-666666666001', '00000000-0000-0000-0000-000000000001', '2025-11-02', 'Presenca'),
  ('66666666-6666-6666-6666-666666666002', '00000000-0000-0000-0000-000000000001', '2025-11-05', 'Falta');

-- Cycles
INSERT INTO cycles (id, person_id, title, status, start_date, end_date)
VALUES
  ('77777777-7777-7777-7777-777777777001', '00000000-0000-0000-0000-000000000001', 'Ciclo 2', 'Atual', '2025-01-10', NULL),
  ('77777777-7777-7777-7777-777777777002', '00000000-0000-0000-0000-000000000001', 'Ciclo 1', 'Historico', '2024-02-01', '2024-12-20');

-- Formations
INSERT INTO formations (id, person_id, institution, course, level, status, period_start, period_end)
VALUES
  ('88888888-8888-8888-8888-888888888001', '00000000-0000-0000-0000-000000000001', 'Universidade Estadual', 'Servico Social', 'Graduacao', 'Concluido', '2012-02-01', '2016-12-15');

-- School histories
INSERT INTO school_histories (id, person_id, year, school, grade, shift, is_current)
VALUES
  ('99999999-9999-9999-9999-999999999001', '00000000-0000-0000-0000-000000000001', 2024, 'E.E. Jardim Azul', '3º ano', 'Noturno', true);

-- Income profiles
INSERT INTO income_profiles (id, person_id, income, income_range_min, income_range_max, other_income, benefits, employment_status, employment_start, employment_end)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '00000000-0000-0000-0000-000000000001', 5200, 4500, 6000, 900, ARRAY['Bolsa Familia','Vale Transporte'], 'CLT', '2021-06-01', '2026-06-01');

-- Family summary + members
INSERT INTO family_summaries (person_id, household_members, dependents, dependent_age_min, dependent_age_max)
VALUES
  ('00000000-0000-0000-0000-000000000001', 3, 1, 6, 12);

INSERT INTO family_members (id, person_id, name, relationship, lives_together, contributes_income, income, notes)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '00000000-0000-0000-0000-000000000001', 'Lucas Campos', 'Responsavel', true, true, 2800, 'Responsavel principal.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '00000000-0000-0000-0000-000000000001', 'Marina Campos', 'Filha', true, false, NULL, 'Dependente.');

-- Assessments
INSERT INTO assessments (id, person_id, title, date, summary, notes_html)
VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '00000000-0000-0000-0000-000000000001', 'Avaliacao socioeconomica', '2025-10-05', 'Analise inicial do perfil socioeconomico.', '<p>Registro de avaliacao inicial com pontos de atencao.</p>');

-- Activities
INSERT INTO activities (id, person_id, title, date, status, notes_html)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddd1', '00000000-0000-0000-0000-000000000001', 'Oficina de convivencia', '2025-11-20', 'Concluida', '<p>Participou com boa interacao.</p>');
