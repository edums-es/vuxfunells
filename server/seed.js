export const DEFAULT_FUNNEL_DEFINITION = {
  doctor: {
    name: 'Dra. Ana',
    role: 'Especialista em Fertilidade',
    avatarUrl: 'https://picsum.photos/id/64/200/200',
    wallpaperUrl: 'https://picsum.photos/id/28/800/1200'
  },
  chat: {
    part1: [
      { id: '1', type: 'audio', content: '0:24', sender: 'doctor', delay: 1500 },
      {
        id: '2',
        type: 'text',
        content: 'Oi! Sou a Dra. Ana. 💛 Mandei esse áudio rapidinho pra me apresentar.',
        sender: 'doctor',
        delay: 1000
      },
      {
        id: '3',
        type: 'text',
        content:
          'Eu sei que tentar engravidar pode ser uma montanha-russa emocional. Mas me conta, há quanto tempo você está tentando?',
        sender: 'doctor',
        delay: 2000,
        requiresInput: true
      },
      {
        id: '4',
        type: 'text',
        content:
          'Entendi. E você sente que seu ciclo é irregular ou já teve algum diagnóstico como SOP ou Endometriose?',
        sender: 'doctor',
        delay: 1500,
        requiresInput: true
      },
      { id: '5', type: 'text', content: 'Obrigada por compartilhar. 🌸', sender: 'doctor', delay: 1000 },
      {
        id: '6',
        type: 'text',
        content:
          "Muitas mulheres com esse perfil têm o que chamo de 'Bloqueio Metabólico'. O corpo está biologicamente apto, mas metabolicamente em alerta.",
        sender: 'doctor',
        delay: 2500
      },
      {
        id: '7',
        type: 'text',
        content: 'Vou te ligar por vídeo rapidinho (1 min) pra te mostrar um esquema visual de como desbloquear isso. Pode ser?',
        sender: 'doctor',
        delay: 2000,
        requiresInput: true
      }
    ],
    part2: [
      {
        id: '10',
        type: 'text',
        content:
          "Faz sentido isso para você? O fato do corpo precisar de 'segurança' antes de permitir a gestação?",
        sender: 'doctor',
        delay: 1000,
        requiresInput: true
      },
      { id: '11', type: 'audio', content: '0:42', sender: 'doctor', delay: 1500 },
      {
        id: '12',
        type: 'text',
        content: 'O Método Fertilidade Natural é exatamente sobre isso. Limpar, Regular e Preparar.',
        sender: 'doctor',
        delay: 2000
      },
      {
        id: '13',
        type: 'text',
        content:
          'Antes de te passar o acesso, dá uma olhada no que aconteceu com a Mariana, a Cláudia e outras alunas. É emocionante ver isso acontecendo.',
        sender: 'doctor',
        delay: 2500,
        action: 'open_reviews'
      }
    ]
  },
  reviews: {
    items: [
      {
        id: 1,
        name: 'Mariana S.',
        age: 32,
        location: 'São Paulo, SP',
        text: 'Depois de 3 anos tentando e 2 FIVs falhas, eu achei que meu útero tinha algum problema. Segui o passo a passo da Dra. Ana e em 4 meses o positivo veio! 😭❤️',
        likes: '12.4K',
        videoUrl: 'https://picsum.photos/id/338/400/800',
        comments: [
          { user: 'jessica_t', text: 'Nossa, meu médico nunca falou isso. Faz todo sentido!', time: '2m', likes: 12, avatarId: 50 },
          { user: 'mamae_ansiosa', text: 'Estou chorando aqui, me deu esperança ❤️', time: '5m', likes: 45, avatarId: 51 },
          { user: 'pri_tentante', text: 'Parabéns Mari! Vou começar hoje.', time: '1h', likes: 8, avatarId: 52 }
        ]
      },
      {
        id: 2,
        name: 'Cláudia R.',
        age: 38,
        location: 'Curitiba, PR',
        text: 'Meu médico disse que pela minha idade seria improvável. O método mudou minha vida, minha disposição e me deu meu maior presente.',
        likes: '8.9K',
        videoUrl: 'https://picsum.photos/id/65/400/800',
        comments: [
          { user: 'brunna_fer', text: 'Idade é só um número quando a saúde tá em dia!', time: '12m', likes: 120, avatarId: 60 },
          { user: 'luciana.p', text: 'Tenho 39 e estava desanimada. Obrigada por postar.', time: '30m', likes: 34, avatarId: 61 },
          { user: 'carol_s', text: 'Que depoimento lindo.', time: '2h', likes: 11, avatarId: 62 }
        ]
      },
      {
        id: 3,
        name: 'Patrícia L.',
        age: 29,
        location: 'Belo Horizonte, MG',
        text: 'Eu tinha SOP severa. Menstruava 2x por ano. Regulei meu ciclo em 60 dias com a alimentação do protocolo. Grávida de 12 semanas! 🙏',
        likes: '22.1K',
        videoUrl: 'https://picsum.photos/id/823/400/800',
        comments: [
          { user: 'sop_guerreiras', text: 'Eu tenho SOP também, é horrível. Vou tentar esse método.', time: '10m', likes: 89, avatarId: 70 },
          { user: 'bia.nca', text: '60 dias?? Meu Deus eu preciso.', time: '45m', likes: 22, avatarId: 71 },
          { user: 'doutora_fane', text: 'Alimentação é tudo mesmo.', time: '3h', likes: 5, avatarId: 72 }
        ]
      },
      {
        id: 4,
        name: 'Fernanda M.',
        age: 35,
        location: 'Rio de Janeiro, RJ',
        text: 'Eu achava que era estresse, mas era inflamação. A Dra Ana explicou tudo. Hoje seguro meu milagre no colo.',
        likes: '15.3K',
        videoUrl: 'https://picsum.photos/id/454/400/800',
        comments: [
          { user: 'rio_40graus', text: 'Inflamação silenciosa é o mal do século.', time: '5m', likes: 67, avatarId: 80 },
          { user: 'tentante.fé', text: 'Amém! O meu vai chegar.', time: '1h', likes: 14, avatarId: 81 }
        ]
      },
      {
        id: 5,
        name: 'Juliana T.',
        age: 41,
        location: 'Salvador, BA',
        text: 'Engravidei naturalmente aos 41. Não deixem ninguém dizer que não é possível. O corpo responde quando a gente trata a causa!',
        likes: '31.2K',
        videoUrl: 'https://picsum.photos/id/342/400/800',
        comments: [
          { user: 'anapaula_40', text: 'Você me inspira Ju! Tenho 42 e não desisti.', time: '1m', likes: 230, avatarId: 90 },
          { user: 'mila_baby', text: 'O corpo é uma máquina perfeita.', time: '15m', likes: 45, avatarId: 91 },
          { user: 'sueli_r', text: 'Que benção!', time: '1d', likes: 10, avatarId: 92 }
        ]
      }
    ]
  },
  checkout: {
    headerLabel: 'Oferta Especial',
    headline: '"Você não é quebrada. Seu corpo só precisa do estímulo certo."',
    subheadline:
      'Desbloqueie sua fertilidade natural em 3 fases simples, sem hormônios sintéticos e sem procedimentos invasivos.',
    badge: 'Método Validado',
    productName: 'Protocolo Fertilidade Natural',
    price: 'R$ 97',
    compareAtPrice: 'R$ 497',
    valueCents: 9700,
    primaryCtaText: 'QUERO COMEÇAR AGORA',
    secondaryCtaText: 'GARANTIR MINHA VAGA',
    securePaymentText: 'Pagamento 100% Seguro',
    bullets: [
      'Cronograma de 30 dias para limpeza uterina',
      'Lista de alimentos que aumentam a progesterona',
      'Técnicas de redução de cortisol (hormônio do estresse)',
      'Bônus: Guia de chás para o ciclo',
      'Acesso vitalício ao material'
    ],
    guaranteeTitle: 'Garantia de 7 Dias',
    guaranteeText:
      'Se você não sentir diferença na sua disposição e no seu ciclo, devolvemos 100% do seu dinheiro. Sem perguntas.',
    checkoutReviews: [
      {
        name: 'Roberta F.',
        text: '"O material é muito bem organizado. Já na primeira semana senti menos inchaço."',
        avatarUrl: 'https://i.pravatar.cc/100?img=5'
      },
      {
        name: 'Camila T.',
        text: '"Vale cada centavo. A Dra Ana explica tudo com muito carinho."',
        avatarUrl: 'https://i.pravatar.cc/100?img=9'
      },
      {
        name: 'Larissa M.',
        text: '"Consegui meu positivo!!! Obrigada por tudo."',
        avatarUrl: 'https://i.pravatar.cc/100?img=20'
      }
    ],
    footerLines: [
      'Copyright © 2024 Jornada Fertilidade.',
      'Este site não possui vínculo com o Facebook ou WhatsApp.'
    ]
  },
  offers: {
    upsells: [
      {
        id: 'upsell-1',
        title: 'Upsell: Acompanhamento VIP por 30 dias',
        subtitle: 'Ajustes personalizados para acelerar resultados e tirar dúvidas.',
        price: 'R$ 47',
        compareAtPrice: 'R$ 197',
        valueCents: 4700,
        bullets: ['Plano alimentar ajustado', 'Checklist semanal', 'Suporte via WhatsApp'],
        acceptText: 'Quero adicionar',
        declineText: 'Não, obrigado'
      }
    ],
    downsells: [
      {
        id: 'downsell-1',
        title: 'Downsell: Guia rápido de 7 dias',
        subtitle: 'Versão enxuta para começar hoje com o básico essencial.',
        price: 'R$ 19',
        compareAtPrice: 'R$ 97',
        valueCents: 1900,
        bullets: ['Rotina 7 dias', 'Lista de compras', 'Receitas simples'],
        acceptText: 'Sim, quero o guia',
        declineText: 'Seguir sem'
      }
    ]
  }
};

