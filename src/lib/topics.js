export const CATEGORIES = [
  {
    id: 'philosophy',
    name: 'Philosophy',
    description: 'Stoicism, existentialism, ethics, epistemology, logic'
  },
  {
    id: 'theology',
    name: 'Christianity & Theology',
    description: 'Early church, councils, reformation, apologetics, church fathers'
  },
  {
    id: 'history',
    name: 'General History',
    description: 'Ancient, Roman, Medieval, Renaissance, Early Modern, Modern'
  },
  {
    id: 'niche-history',
    name: 'Niche History',
    description: 'Coffee, pirates, spice trade, banking, maps, and forgotten stories'
  },
  {
    id: 'economics',
    name: 'Economics',
    description: 'Capitalism, communism, feudalism, key thinkers, and how economies actually work'
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Black holes, quantum physics, the brain, genetics, space, and how the universe works'
  }
]

const TOPIC_POOLS = {
  philosophy: [
    'the Stoic concept of the dichotomy of control',
    'Socrates and the examined life',
    "Aristotle's concept of eudaimonia",
    "Plato's Allegory of the Cave",
    'the sorites paradox and the problem of vagueness',
    "Kant's categorical imperative",
    "Nietzsche's will to power and its misreadings",
    "Hume's problem of induction",
    "Descartes' evil demon thought experiment",
    "Pascal's Wager and its hidden complications",
    'the Stoic view of death and mortality',
    "Epictetus and the art of living",
    "Marcus Aurelius and the philosopher-king",
    'existential bad faith in Sartre',
    "Camus and the myth of Sisyphus",
    'the trolley problem and moral intuitions',
    "Mill's utilitarianism and the greatest happiness principle",
    "Rawls's veil of ignorance",
    'the problem of evil in philosophy',
    'free will versus determinism',
    "Wittgenstein and the limits of language",
    "Heraclitus and the philosophy of flux",
    'the Epicurean path to tranquility',
    "Zeno's paradoxes of motion",
    'the philosophical zombie thought experiment',
    "Aristotle's four causes",
    "the Ship of Theseus and personal identity",
    "Seneca on the shortness of time",
    "Plato's theory of forms",
    "the Stoic concept of logos"
  ],
  theology: [
    'the Council of Nicaea and the Arian controversy',
    'the early Christian martyrs and why they died',
    "Augustine's doctrine of original sin",
    'the Desert Fathers and Christian monasticism',
    "Athanasius and the canon of Scripture",
    'the Great Schism of 1054',
    "Thomas Aquinas and the Five Ways",
    "Luther's Ninety-Five Theses and what sparked them",
    "Calvin and the doctrine of predestination",
    'the Council of Trent and Catholic reform',
    "Anselm's ontological argument",
    'the Nicene Creed and its political context',
    'Origen and early Christian allegory',
    'the Donatist controversy',
    'Ignatius of Antioch and early church structure',
    'the Gnostic gospels and why they were rejected',
    'the Pelagian controversy',
    'the role of women in the early church',
    'Justin Martyr and early Christian apologetics',
    'the development of the doctrine of the Trinity',
    'the Waldensians — medieval dissenters before the Reformation',
    'John Wycliffe and the pre-Reformation reform movement',
    'Dietrich Bonhoeffer and theology under Nazism',
    'the theology of the cross versus the theology of glory',
    'Tertullian: the first Latin theologian',
    "Irenaeus and the rule of faith",
    "Chrysostom and the golden-mouthed preacher",
    "the Council of Chalcedon and the nature of Christ",
    "the Cappadocian Fathers and trinitarian theology",
    "Francis of Assisi and the medieval reform impulse"
  ],
  'political-philosophy': [
    "Plato's philosopher-kings and why democracy worried him",
    "Aristotle's Politics and the best regime",
    "Machiavelli and the divorce of ethics from politics",
    "Hobbes's Leviathan and the state of nature",
    "Locke's natural rights and their revolutionary influence",
    "Rousseau's general will and its dangers",
    "Burke's critique of the French Revolution",
    "Tocqueville's warnings about soft despotism",
    'Montesquieu and the separation of powers',
    'the Federalist Papers and republican government',
    'Adam Smith and the invisible hand',
    "Marx's theory of historical materialism",
    "Mill on liberty and the harm principle",
    "Hegel's dialectic and the end of history",
    "Arendt on the origins of totalitarianism",
    "Hayek's Road to Serfdom",
    "Oakeshott's conservatism as a disposition",
    'Carl Schmitt and the concept of the political',
    'Rawls versus Nozick on distributive justice',
    'Cicero and Roman republican thought',
    'Thucydides and the Melian Dialogue',
    "Isaiah Berlin's two concepts of liberty",
    "de Maistre and the counter-revolutionary tradition",
    "Strauss and the quarrel between ancients and moderns",
    "Solzhenitsyn's critique of the West"
  ],
  history: [
    'the fall of the Roman Republic and what it tells us',
    'the Peloponnesian War and Athens versus Sparta',
    "Alexander the Great's campaign in Persia",
    'the Punic Wars between Rome and Carthage',
    'the Black Death and its civilizational impact',
    'the Mongol conquests and the Pax Mongolica',
    'the Byzantine Empire — the Roman Empire that survived',
    'the Crusades — causes, conduct, and consequences',
    'the Italian Renaissance and the rebirth of antiquity',
    'the Thirty Years War and the birth of state sovereignty',
    'the English Civil War and the regicide of Charles I',
    'the Scientific Revolution and how it changed everything',
    'the French Revolution — liberty, terror, and Napoleon',
    'the Congress of Vienna and the conservative order',
    'the revolutions of 1848 across Europe',
    'the scramble for Africa and the Berlin Conference',
    'the causes of World War I — assassination or inevitability?',
    'the Weimar Republic and how democracy failed',
    'the Cold War origins at Yalta and Potsdam',
    'the Achaemenid Persian Empire at its height',
    'the reign of Charlemagne and the Carolingian Renaissance',
    'the collapse of the Bronze Age civilizations',
    'the Silk Road as the first globalization',
    'the Roman Principate — how Augustus disguised a monarchy',
    'the Viking Age beyond the raids',
    "the Ottoman Empire at its zenith",
    "the Spanish Conquest of the Aztec Empire",
    "the Glorious Revolution of 1688",
    "the American founding and its classical republican roots",
    "the Meiji Restoration and Japanese modernization"
  ],
  economics: [
    'Adam Smith and the origins of capitalism',
    'Karl Marx and the critique of capital',
    'feudalism and the manorial economy',
    'mercantilism and the zero-sum world',
    'the Industrial Revolution and the birth of the factory',
    'the Great Depression — causes, responses, and legacy',
    'Keynesian economics and the role of government spending',
    'the Austrian School: Hayek, Mises, and the price system',
    'the Bretton Woods system and the postwar economic order',
    'the stagflation crisis of the 1970s',
    'the history of money — from commodity to fiat',
    'the origins of central banking',
    'the East India Company and the corporation as empire',
    'the enclosure movement and the creation of the proletariat',
    'Soviet command economy — how it worked and why it failed',
    'Maoism and the economics of the Great Leap Forward',
    'the history of debt and its civilizational consequences',
    'Ricardo and the theory of comparative advantage',
    'Malthus and the population trap',
    'the Chicago School and the monetarist revolution',
    'the Dutch Golden Age and the first modern economy',
    'the history of inflation — from Rome to Weimar',
    'the transatlantic slave trade as an economic system',
    'Schumpeter and creative destruction',
    'colonialism as an economic project',
    'the role of property rights in economic development',
    'the Green Revolution and the economics of food'
  ],
  science: [
    'black holes — what they are and what happens inside one',
    'the James Webb Space Telescope and what it has revealed',
    'quantum entanglement and what it means for reality',
    'CRISPR gene editing and the future of biology',
    'the theory of general relativity in plain language',
    'dark matter and dark energy — what we know and don\'t',
    'the human microbiome and its role in health',
    'neuroplasticity — how the brain rewires itself',
    'the science of red light therapy',
    'epigenetics — how environment shapes gene expression',
    'the Big Bang and the first seconds of the universe',
    'the hard problem of consciousness',
    'mitochondria and the origins of complex life',
    'the gut-brain axis',
    'sleep science — what actually happens when you sleep',
    'nuclear fusion and the quest for limitless energy',
    'the multiverse — science or speculation?',
    'how psychedelics affect the brain',
    'telomeres, aging, and the biology of getting old',
    'the placebo effect and the power of expectation',
    'evolution by natural selection — Darwin\'s idea unpacked',
    'the immune system — a primer',
    'string theory and the search for a theory of everything',
    'how vaccines actually work',
    'the Fermi Paradox — where is everybody?',
    'the speed of light and why nothing can exceed it',
    'DNA — the molecule that runs everything',
    'the science of addiction and the brain\'s reward system'
  ]
}

const NICHE_HISTORY_PROMPT = `Choose a genuinely surprising, obscure, or underappreciated niche topic from history. Avoid famous or obvious subjects. Think about: forgotten technologies, lost trades, strange legal systems, peculiar customs, overlooked inventions, obscure plagues, forgotten empires, bizarre historical incidents, or surprising origin stories of everyday things. The topic should make a curious reader think "I never knew that existed." Avoid tulip mania, the spice trade, or piracy — find something more unexpected.`

export function getTopicPrompt(categoryId, completedTopics = []) {
  if (categoryId === 'niche-history') {
    const avoidList = completedTopics.length > 0
      ? `\n\nPreviously covered topics — do not repeat these: ${completedTopics.slice(-30).join('; ')}.`
      : ''
    return `Category: Niche History\n\n${NICHE_HISTORY_PROMPT}${avoidList}`
  }

  const pool = TOPIC_POOLS[categoryId] || []
  const lowerCompleted = completedTopics.map(t => t.toLowerCase())
  const available = pool.filter(t => !lowerCompleted.some(ct => ct.includes(t.split(' ')[1]?.toLowerCase() || t.split(' ')[0].toLowerCase())))
  const topic = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : pool[Math.floor(Math.random() * pool.length)]

  const category = CATEGORIES.find(c => c.id === categoryId)
  const avoidList = completedTopics.length > 0
    ? `\n\nPreviously covered topics — do not repeat these: ${completedTopics.slice(-30).join('; ')}.`
    : ''

  return `Category: ${category?.name || categoryId}\nTopic: ${topic}${avoidList}`
}

export function getRandomActiveCategory(activeCategories) {
  if (!activeCategories || activeCategories.length === 0) return CATEGORIES[0].id
  return activeCategories[Math.floor(Math.random() * activeCategories.length)]
}

export function getWeightedCategory(activeCategories, tasteProfile) {
  if (!activeCategories || activeCategories.length === 0) return CATEGORIES[0].id
  if (!tasteProfile || Object.keys(tasteProfile).length === 0) {
    return getRandomActiveCategory(activeCategories)
  }

  const weights = activeCategories.map(id => {
    const pursues = tasteProfile[`pursue_${id}`] || 0
    const skips = tasteProfile[`skip_${id}`] || 0
    return Math.max(0.1, 1.0 + pursues * 0.5 - skips * 0.4)
  })

  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < activeCategories.length; i++) {
    r -= weights[i]
    if (r <= 0) return activeCategories[i]
  }
  return activeCategories[activeCategories.length - 1]
}
