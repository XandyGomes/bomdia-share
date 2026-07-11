/**
 * src/constants/frases.js
 * Banco de frases prontas pra desenhar sobre fotos sem texto (ex: Pexels)
 */

export const FRASES = {
  'bom-dia': [
    'Bom dia! Que seu dia seja abençoado.',
    'Acorde e brilhe, hoje é um novo dia!',
    'Bom dia! Gratidão por mais um amanhecer.',
    'Que hoje seja leve e cheio de sorrisos.',
    'Bom dia! Vai dar tudo certo.',
    'Comece o dia com fé e alegria.',
    'Bom dia! Sua luz ilumina o mundo.',
    'Hoje é dia de coisas boas acontecerem.',
    'Bom dia! Respire, agradeça e siga em frente.',
    'Que a paz esteja com você hoje.',
  ],
  'boa-tarde': [
    'Boa tarde! Que seu dia continue leve.',
    'Boa tarde! Renove as energias e siga em frente.',
    'Uma pausa pra sorrir: boa tarde!',
    'Boa tarde! Que tudo corra bem até o fim do dia.',
    'Força pra terminar o dia com o coração leve.',
    'Boa tarde! Você está indo muito bem.',
    'Que essa tarde traga boas notícias.',
    'Boa tarde! Respire fundo e continue.',
  ],
  'boa-noite': [
    'Boa noite! Descanse, amanhã é um novo dia.',
    'Boa noite! Que seus sonhos sejam leves.',
    'Gratidão por esse dia. Boa noite!',
    'Boa noite! Durma em paz.',
    'Que a noite traga descanso pro corpo e pra alma.',
    'Boa noite! Até amanhã, com fé.',
    'Encerre o dia com o coração tranquilo.',
    'Boa noite! Você merece descansar.',
  ],
  motivacao: [
    'Acredite: você é capaz de tudo.',
    'Um passo de cada vez já é progresso.',
    'Sua determinação é mais forte que qualquer obstáculo.',
    'Continue. O melhor ainda está por vir.',
    'Grandes conquistas começam com pequenas atitudes.',
    'Não desista, você chegou até aqui por um motivo.',
    'Foco, força e fé — você vai conseguir.',
    'Hoje é um bom dia pra recomeçar.',
    'Sua jornada é única. Confie no processo.',
  ],
  fe: [
    'Deus é fiel em todas as horas.',
    'Entrega o teu caminho ao Senhor.',
    'Com fé, tudo é possível.',
    'Deus cuida de cada detalhe da sua vida.',
    'Confia: Ele nunca te abandona.',
    'A fé move montanhas.',
    'Deus está no controle de tudo.',
    'Ore, agradeça e siga em frente.',
  ],
  amor: [
    'O amor tudo pode.',
    'Espalhe amor por onde passar.',
    'Um coração grato atrai coisas boas.',
    'Amar é a resposta pra tudo.',
    'Você é amado, nunca esqueça disso.',
    'O amor verdadeiro começa dentro da gente.',
    'Que o amor guie cada passo seu hoje.',
  ],
  default: [
    'Que seu dia seja repleto de coisas boas.',
    'Gratidão por mais um dia de vida.',
    'Acredite: dias melhores estão chegando.',
    'Pequenos gestos, grandes sorrisos.',
    'Hoje é um bom dia pra ser feliz.',
    'Que a paz esteja no seu coração hoje.',
  ],
};

/**
 * Retorna a lista de frases da categoria, ou a lista padrão se não houver
 * categoria ativa (ex: busca livre) ou a categoria não tiver frases próprias
 * @param {string|null} categoriaId
 * @returns {string[]}
 */
export function getFrasesPorCategoria(categoriaId) {
  return FRASES[categoriaId] || FRASES.default;
}
