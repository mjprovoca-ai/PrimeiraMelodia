-- Primeira Melodia V2 · dados iniciais (configurações públicas, pacotes, itens dos mundos e metas)
-- Segredos (tópico do aviso, e-mails da administração, segredo do agendador) NÃO ficam aqui: vão direto no banco.

insert into public.config (chave, valor, publico) values
  ('fundo_percentual', '10', true),
  ('pix_minutos', '60', false),
  ('palco_moderacao_previa', 'false', true),
  ('modo_teste', 'true', true),
  ('aviso', '""', true)
on conflict (chave) do nothing;

insert into public.pacotes (id, nome, creditos, preco_centavos, destaque, ordem) values
  (1, '1 música', 1, 990, false, 1),
  (2, '5 músicas', 5, 3990, true, 2),
  (3, '10 músicas', 10, 6990, false, 3)
on conflict (id) do nothing;
select setval(pg_get_serial_sequence('public.pacotes', 'id'), 3);

insert into public.catalogo_itens (id, mundo, nome, arte, zona, largura, comum, especial, boas_vindas, preco_sementes, descricao, ordem) values
  ('broto',             'floresta', 'Broto',              'floresta/broto.svg',             'chao',  0.090, true,  null, true,  null, 'A primeira melodia plantada.', 1),
  ('arvore-redonda',    'floresta', 'Árvore redonda',     'floresta/arvore-redonda.svg',    'chao',  0.130, true,  null, false, 20,   'Copa cheia, sombra boa.', 2),
  ('arvore-barra',      'floresta', 'Árvore-barra',       'floresta/arvore-barra.svg',      'chao',  0.060, true,  null, false, null, 'Alta como a barra do equalizador.', 3),
  ('ipe-amarelo',       'floresta', 'Ipê-amarelo',        'floresta/ipe-amarelo.svg',       'chao',  0.170, false, 1,    false, 60,   'A árvore especial da floresta.', 4),
  ('vagalume',          'floresta', 'Vagalume',           'floresta/vagalume.svg',          'ar',    0.045, false, 2,    false, 15,   'Uma luzinha que dança à noite.', 5),
  ('nota',              'floresta', 'Nota musical',       'floresta/nota.svg',              'ar',    0.040, false, null, false, 10,   'Uma colcheia solta no ar.', 6),
  ('peixe',             'oceano',   'Peixe-laranja',      'oceano/peixe.svg',               'agua',  0.110, true,  null, true,  null, 'O primeiro morador do seu oceano.', 1),
  ('peixe-sol',         'oceano',   'Peixe-sol',          'oceano/peixe-sol.svg',           'agua',  0.110, true,  null, false, 15,   'Amarelo como o sol do app.', 2),
  ('coral',             'oceano',   'Coral',              'oceano/coral.svg',               'fundo', 0.090, true,  null, false, 15,   'Coral-equalizador.', 3),
  ('tartaruga',         'oceano',   'Tartaruga',          'oceano/tartaruga.svg',           'agua',  0.170, false, 1,    false, 60,   'A especial do oceano.', 4),
  ('agua-viva',         'oceano',   'Água-viva',          'oceano/agua-viva.svg',           'agua',  0.080, false, 2,    false, 25,   'Brilha no escuro.', 5),
  ('borboleta',         'animais',  'Borboleta',          'animais/borboleta.svg',          'ar',    0.060, true,  null, true,  10,   'Leve como uma melodia.', 1),
  ('tucano',            'animais',  'Tucano',             'animais/tucano.svg',             'chao',  0.100, true,  null, false, 25,   'Bico laranja, claro.', 2),
  ('capivara',          'animais',  'Capivara',           'animais/capivara.svg',           'chao',  0.160, false, 1,    false, 60,   'Com o passarinho na cabeça.', 3),
  ('mico-leao-dourado', 'animais',  'Mico-leão-dourado',  'animais/mico-leao-dourado.svg',  'chao',  0.080, false, 2,    false, 50,   'Raro e dourado.', 4),
  ('estrela',           'universo', 'Estrela',            'universo/estrela.svg',           'ceu',   0.060, true,  null, true,  10,   'Cada música acende uma.', 1),
  ('estrela-laranja',   'universo', 'Estrela-laranja',    'universo/estrela-laranja.svg',   'ceu',   0.060, true,  null, false, 15,   'Uma estrela da cor da marca.', 2),
  ('planeta',           'universo', 'Planeta com anel',   'universo/planeta.svg',           'ceu',   0.200, false, 1,    false, 60,   'O especial do universo.', 3),
  ('lua',               'universo', 'Lua',                'universo/lua.svg',               'ceu',   0.080, false, 2,    false, 40,   'A lua em anel do app.', 4)
on conflict (id) do nothing;

insert into public.metas (id, tipo, limiar, sementes, especial, titulo, descricao, ordem) values
  ('musicas-1',    'musicas',           1,     5,   null, 'Primeira melodia',   'Você criou sua primeira música.', 1),
  ('musicas-5',    'musicas',           5,     10,  null, 'Cantoria',           '5 músicas criadas.', 2),
  ('musicas-10',   'musicas',           10,    20,  1,    'Compositora',        '10 músicas criadas: um item especial no seu mundo.', 3),
  ('musicas-25',   'musicas',           25,    40,  null, 'Coral inteiro',      '25 músicas criadas.', 4),
  ('musicas-50',   'musicas',           50,    80,  2,    'Orquestra',          '50 músicas criadas: mais um item especial.', 5),
  ('musicas-100',  'musicas',           100,   150, null, 'Lenda do Palco',     '100 músicas criadas.', 6),
  ('plays-100',    'plays',             100,   10,  null, 'Primeiros ouvintes', '100 plays de outras pessoas nas suas músicas.', 1),
  ('plays-1000',   'plays',             1000,  40,  1,    'Sucesso no Palco',   '1.000 plays: um item especial.', 2),
  ('plays-10000',  'plays',             10000, 150, 2,    'Hit',                '10.000 plays.', 3),
  ('compart-10',   'compartilhamentos', 10,    10,  null, 'Espalhando melodia', '10 compartilhamentos.', 1),
  ('compart-50',   'compartilhamentos', 50,    40,  null, 'Voz que ecoa',       '50 compartilhamentos.', 2),
  ('compart-200',  'compartilhamentos', 200,   100, 2,    'Embaixadora',        '200 compartilhamentos: um item especial.', 3),
  ('convites-1',   'convites',          1,     10,  null, 'Primeiro convite',   'Alguém entrou pelo seu convite.', 1),
  ('convites-5',   'convites',          5,     40,  1,    'Roda de amigos',     '5 pessoas entraram pelo seu convite.', 2),
  ('convites-20',  'convites',          20,    150, 2,    'Comunidade',         '20 pessoas entraram pelo seu convite.', 3)
on conflict (id) do nothing;
