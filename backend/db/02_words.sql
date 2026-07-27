-- Auto-loaded by MySQL on first init (docker-entrypoint-initdb.d).
-- Loads the Slang! starter word list. Idempotent: safe to re-run.
-- Generated from slang_words.csv. Whitespace trimmed, duplicates removed.

USE cp476_afterhours;

-- Ensure the gameplay category exists exactly once.
INSERT INTO Categories (category)
SELECT 'Slang Words'
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE category = 'Slang Words');

-- Insert each term if it is not already present.
INSERT INTO Terms (term) SELECT 'rizz' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'rizz');
INSERT INTO Terms (term) SELECT 'finesse' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'finesse');
INSERT INTO Terms (term) SELECT 'zesty' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'zesty');
INSERT INTO Terms (term) SELECT 'swag' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'swag');
INSERT INTO Terms (term) SELECT 'gang' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'gang');
INSERT INTO Terms (term) SELECT 'gucci' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'gucci');
INSERT INTO Terms (term) SELECT 'illest' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'illest');
INSERT INTO Terms (term) SELECT 'thicc' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'thicc');
INSERT INTO Terms (term) SELECT 'drip' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'drip');
INSERT INTO Terms (term) SELECT 'yeet' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yeet');
INSERT INTO Terms (term) SELECT 'extra' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'extra');
INSERT INTO Terms (term) SELECT 'salty' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'salty');
INSERT INTO Terms (term) SELECT 'basic' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'basic');
INSERT INTO Terms (term) SELECT 'lit' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'lit');
INSERT INTO Terms (term) SELECT 'goat' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'goat');
INSERT INTO Terms (term) SELECT 'flex' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'flex');
INSERT INTO Terms (term) SELECT 'ghost' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'ghost');
INSERT INTO Terms (term) SELECT 'sus' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'sus');
INSERT INTO Terms (term) SELECT 'cap' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'cap');
INSERT INTO Terms (term) SELECT 'bet' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'bet');
INSERT INTO Terms (term) SELECT 'fam' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'fam');
INSERT INTO Terms (term) SELECT 'vibe' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'vibe');
INSERT INTO Terms (term) SELECT 'chill' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'chill');
INSERT INTO Terms (term) SELECT 'woke' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'woke');
INSERT INTO Terms (term) SELECT 'slay' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'slay');
INSERT INTO Terms (term) SELECT 'fire' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'fire');
INSERT INTO Terms (term) SELECT 'cringe' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'cringe');
INSERT INTO Terms (term) SELECT 'snack' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'snack');
INSERT INTO Terms (term) SELECT 'simp' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'simp');
INSERT INTO Terms (term) SELECT 'stan' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'stan');
INSERT INTO Terms (term) SELECT 'tea' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tea');
INSERT INTO Terms (term) SELECT 'shade' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'shade');
INSERT INTO Terms (term) SELECT 'clout' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'clout');
INSERT INTO Terms (term) SELECT 'savage' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'savage');
INSERT INTO Terms (term) SELECT 'bougie' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'bougie');
INSERT INTO Terms (term) SELECT 'petty' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'petty');
INSERT INTO Terms (term) SELECT 'thirsty' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'thirsty');
INSERT INTO Terms (term) SELECT 'hype' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'hype');
INSERT INTO Terms (term) SELECT 'dope' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dope');
INSERT INTO Terms (term) SELECT 'gassed' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'gassed');
INSERT INTO Terms (term) SELECT 'broke' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'broke');
INSERT INTO Terms (term) SELECT 'wavy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'wavy');
INSERT INTO Terms (term) SELECT 'grimy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'grimy');
INSERT INTO Terms (term) SELECT 'icy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'icy');
INSERT INTO Terms (term) SELECT 'peak' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'peak');
INSERT INTO Terms (term) SELECT 'mid' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mid');
INSERT INTO Terms (term) SELECT 'rad' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'rad');
INSERT INTO Terms (term) SELECT 'zen' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'zen');
INSERT INTO Terms (term) SELECT 'nasty' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'nasty');
INSERT INTO Terms (term) SELECT 'yikes' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yikes');
INSERT INTO Terms (term) SELECT 'ate' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'ate');
INSERT INTO Terms (term) SELECT 'edgy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'edgy');
INSERT INTO Terms (term) SELECT 'yolo' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yolo');
INSERT INTO Terms (term) SELECT 'opp' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'opp');
INSERT INTO Terms (term) SELECT 'plug' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'plug');
INSERT INTO Terms (term) SELECT 'glow' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'glow');
INSERT INTO Terms (term) SELECT 'whip' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'whip');
INSERT INTO Terms (term) SELECT 'posh' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'posh');
INSERT INTO Terms (term) SELECT 'hangry' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'hangry');
INSERT INTO Terms (term) SELECT 'janky' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'janky');
INSERT INTO Terms (term) SELECT 'noob' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'noob');
INSERT INTO Terms (term) SELECT 'based' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'based');
INSERT INTO Terms (term) SELECT 'dank' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dank');
INSERT INTO Terms (term) SELECT 'kicks' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'kicks');
INSERT INTO Terms (term) SELECT 'sauce' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'sauce');
INSERT INTO Terms (term) SELECT 'lowkey' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'lowkey');
INSERT INTO Terms (term) SELECT 'yeeted' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yeeted');
INSERT INTO Terms (term) SELECT 'dripped' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dripped');
INSERT INTO Terms (term) SELECT 'deadass' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'deadass');
INSERT INTO Terms (term) SELECT 'skibidi' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'skibidi');
INSERT INTO Terms (term) SELECT 'rizzler' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'rizzler');
INSERT INTO Terms (term) SELECT 'gyat' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'gyat');
INSERT INTO Terms (term) SELECT 'tweaking' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tweaking');
INSERT INTO Terms (term) SELECT 'zaddy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'zaddy');
INSERT INTO Terms (term) SELECT 'yassify' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yassify');
INSERT INTO Terms (term) SELECT 'gaslight' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'gaslight');
INSERT INTO Terms (term) SELECT 'aura' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'aura');
INSERT INTO Terms (term) SELECT 'aight' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'aight');
INSERT INTO Terms (term) SELECT 'boujee' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'boujee');
INSERT INTO Terms (term) SELECT 'epic' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'epic');
INSERT INTO Terms (term) SELECT 'crusty' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'crusty');
INSERT INTO Terms (term) SELECT 'snatched' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'snatched');
INSERT INTO Terms (term) SELECT 'delulu' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'delulu');
INSERT INTO Terms (term) SELECT 'unbothered' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'unbothered');
INSERT INTO Terms (term) SELECT 'demure' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'demure');
INSERT INTO Terms (term) SELECT 'awkward' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'awkward');
INSERT INTO Terms (term) SELECT 'drama' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'drama');
INSERT INTO Terms (term) SELECT 'amped' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'amped');
INSERT INTO Terms (term) SELECT 'nerdy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'nerdy');
INSERT INTO Terms (term) SELECT 'yassed' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yassed');
INSERT INTO Terms (term) SELECT 'dweeb' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dweeb');
INSERT INTO Terms (term) SELECT 'banger' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'banger');
INSERT INTO Terms (term) SELECT 'retro' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'retro');
INSERT INTO Terms (term) SELECT 'oomf' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'oomf');
INSERT INTO Terms (term) SELECT 'finna' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'finna');
INSERT INTO Terms (term) SELECT 'adorbs' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'adorbs');
INSERT INTO Terms (term) SELECT 'sketchy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'sketchy');
INSERT INTO Terms (term) SELECT 'xoxo' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'xoxo');
INSERT INTO Terms (term) SELECT 'oomph' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'oomph');
INSERT INTO Terms (term) SELECT 'homie' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'homie');
INSERT INTO Terms (term) SELECT 'queen' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'queen');
INSERT INTO Terms (term) SELECT 'quirky' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'quirky');
INSERT INTO Terms (term) SELECT 'undercooked' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'undercooked');
INSERT INTO Terms (term) SELECT 'downbad' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'downbad');
INSERT INTO Terms (term) SELECT 'dweeby' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dweeby');
INSERT INTO Terms (term) SELECT 'yikers' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yikers');
INSERT INTO Terms (term) SELECT 'squad' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'squad');
INSERT INTO Terms (term) SELECT 'dime' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dime');
INSERT INTO Terms (term) SELECT 'egirl' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'egirl');
INSERT INTO Terms (term) SELECT 'mood' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mood');
INSERT INTO Terms (term) SELECT 'kewl' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'kewl');
INSERT INTO Terms (term) SELECT 'lame' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'lame');
INSERT INTO Terms (term) SELECT 'esketit' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'esketit');
INSERT INTO Terms (term) SELECT 'tight' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tight');
INSERT INTO Terms (term) SELECT 'turnt' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'turnt');
INSERT INTO Terms (term) SELECT 'dead' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dead');
INSERT INTO Terms (term) SELECT 'yappin' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yappin');
INSERT INTO Terms (term) SELECT 'zonked' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'zonked');
INSERT INTO Terms (term) SELECT 'zooted' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'zooted');
INSERT INTO Terms (term) SELECT 'wig' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'wig');
INSERT INTO Terms (term) SELECT 'woozy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'woozy');
INSERT INTO Terms (term) SELECT 'glowup' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'glowup');
INSERT INTO Terms (term) SELECT 'hater' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'hater');
INSERT INTO Terms (term) SELECT 'icky' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'icky');
INSERT INTO Terms (term) SELECT 'juiced' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'juiced');
INSERT INTO Terms (term) SELECT 'keen' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'keen');
INSERT INTO Terms (term) SELECT 'litty' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'litty');
INSERT INTO Terms (term) SELECT 'mad' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mad');
INSERT INTO Terms (term) SELECT 'nerdcore' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'nerdcore');
INSERT INTO Terms (term) SELECT 'outta' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'outta');
INSERT INTO Terms (term) SELECT 'posted' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'posted');
INSERT INTO Terms (term) SELECT 'raging' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'raging');
INSERT INTO Terms (term) SELECT 'random' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'random');
INSERT INTO Terms (term) SELECT 'raw' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'raw');
INSERT INTO Terms (term) SELECT 'rowdy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'rowdy');
INSERT INTO Terms (term) SELECT 'salt' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'salt');
INSERT INTO Terms (term) SELECT 'scrub' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'scrub');
INSERT INTO Terms (term) SELECT 'shady' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'shady');
INSERT INTO Terms (term) SELECT 'sheesh' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'sheesh');
INSERT INTO Terms (term) SELECT 'shook' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'shook');
INSERT INTO Terms (term) SELECT 'side-eye' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'side-eye');
INSERT INTO Terms (term) SELECT 'slaps' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'slaps');
INSERT INTO Terms (term) SELECT 'slick' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'slick');
INSERT INTO Terms (term) SELECT 'snitch' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'snitch');
INSERT INTO Terms (term) SELECT 'spicy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'spicy');
INSERT INTO Terms (term) SELECT 'stacked' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'stacked');
INSERT INTO Terms (term) SELECT 'stale' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'stale');
INSERT INTO Terms (term) SELECT 'stoked' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'stoked');
INSERT INTO Terms (term) SELECT 'sugar' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'sugar');
INSERT INTO Terms (term) SELECT 'swole' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'swole');
INSERT INTO Terms (term) SELECT 'tacky' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tacky');
INSERT INTO Terms (term) SELECT 'tender' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tender');
INSERT INTO Terms (term) SELECT 'toxic' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'toxic');
INSERT INTO Terms (term) SELECT 'trash' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'trash');
INSERT INTO Terms (term) SELECT 'trippy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'trippy');
INSERT INTO Terms (term) SELECT 'turnup' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'turnup');
INSERT INTO Terms (term) SELECT 'unfazed' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'unfazed');
INSERT INTO Terms (term) SELECT 'vain' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'vain');
INSERT INTO Terms (term) SELECT 'valid' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'valid');
INSERT INTO Terms (term) SELECT 'vibes' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'vibes');
INSERT INTO Terms (term) SELECT 'viral' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'viral');
INSERT INTO Terms (term) SELECT 'vixen' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'vixen');
INSERT INTO Terms (term) SELECT 'warped' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'warped');
INSERT INTO Terms (term) SELECT 'weak' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'weak');
INSERT INTO Terms (term) SELECT 'weird' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'weird');
INSERT INTO Terms (term) SELECT 'wild' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'wild');
INSERT INTO Terms (term) SELECT 'yappy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'yappy');
INSERT INTO Terms (term) SELECT 'zappy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'zappy');
INSERT INTO Terms (term) SELECT 'kirk' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'kirk');
INSERT INTO Terms (term) SELECT 'tung tung tung sahur' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tung tung tung sahur');
INSERT INTO Terms (term) SELECT 'blessed' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'blessed');
INSERT INTO Terms (term) SELECT 'ahlie' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'ahlie');
INSERT INTO Terms (term) SELECT 'mandem' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mandem');
INSERT INTO Terms (term) SELECT 'tweaker' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tweaker');
INSERT INTO Terms (term) SELECT 'tripping' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'tripping');
INSERT INTO Terms (term) SELECT 'trippin' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'trippin');
INSERT INTO Terms (term) SELECT 'cooked' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'cooked');
INSERT INTO Terms (term) SELECT 'cracked' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'cracked');
INSERT INTO Terms (term) SELECT 'mod' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mod');
INSERT INTO Terms (term) SELECT 'brainrot' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'brainrot');
INSERT INTO Terms (term) SELECT 'joybait' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'joybait');
INSERT INTO Terms (term) SELECT 'ragebait' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'ragebait');
INSERT INTO Terms (term) SELECT 'inter' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'inter');
INSERT INTO Terms (term) SELECT 'feeder' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'feeder');
INSERT INTO Terms (term) SELECT 'mogged' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mogged');
INSERT INTO Terms (term) SELECT 'mogging' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mogging');
INSERT INTO Terms (term) SELECT 'abg' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'abg');
INSERT INTO Terms (term) SELECT 'abb' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'abb');
INSERT INTO Terms (term) SELECT 'milf' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'milf');
INSERT INTO Terms (term) SELECT 'dilf' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'dilf');
INSERT INTO Terms (term) SELECT 'babygirl' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'babygirl');
INSERT INTO Terms (term) SELECT 'mommy' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'mommy');
INSERT INTO Terms (term) SELECT 'baddie' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'baddie');
INSERT INTO Terms (term) SELECT 'chopped' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'chopped');
INSERT INTO Terms (term) SELECT 'farming' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'farming');
INSERT INTO Terms (term) SELECT 'bomboclatt' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'bomboclatt');
INSERT INTO Terms (term) SELECT 'bloodclatt' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'bloodclatt');
INSERT INTO Terms (term) SELECT 'pussyclatt' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'pussyclatt');
INSERT INTO Terms (term) SELECT 'buns' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'buns');
INSERT INTO Terms (term) SELECT 'memes' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'memes');
INSERT INTO Terms (term) SELECT 'chat' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'chat');
INSERT INTO Terms (term) SELECT 'chud' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'chud');
INSERT INTO Terms (term) SELECT 'chuzz' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'chuzz');
INSERT INTO Terms (term) SELECT 'huzz' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'huzz');
INSERT INTO Terms (term) SELECT 'clanker' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'clanker');
INSERT INTO Terms (term) SELECT 'computa' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'computa');
INSERT INTO Terms (term) SELECT 'copium' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'copium');
INSERT INTO Terms (term) SELECT 'crashout' WHERE NOT EXISTS (SELECT 1 FROM Terms WHERE term = 'crashout');

-- Link every 'Slang Words' term to the category (skips existing links).
INSERT IGNORE INTO Term_Category (term_id, category_id)
SELECT t.term_id, c.category_id
FROM Terms t
JOIN Categories c ON c.category = 'Slang Words'
WHERE t.term IN (
  'rizz',
  'finesse',
  'zesty',
  'swag',
  'gang',
  'gucci',
  'illest',
  'thicc',
  'drip',
  'yeet',
  'extra',
  'salty',
  'basic',
  'lit',
  'goat',
  'flex',
  'ghost',
  'sus',
  'cap',
  'bet',
  'fam',
  'vibe',
  'chill',
  'woke',
  'slay',
  'fire',
  'cringe',
  'snack',
  'simp',
  'stan',
  'tea',
  'shade',
  'clout',
  'savage',
  'bougie',
  'petty',
  'thirsty',
  'hype',
  'dope',
  'gassed',
  'broke',
  'wavy',
  'grimy',
  'icy',
  'peak',
  'mid',
  'rad',
  'zen',
  'nasty',
  'yikes',
  'ate',
  'edgy',
  'yolo',
  'opp',
  'plug',
  'glow',
  'whip',
  'posh',
  'hangry',
  'janky',
  'noob',
  'based',
  'dank',
  'kicks',
  'sauce',
  'lowkey',
  'yeeted',
  'dripped',
  'deadass',
  'skibidi',
  'rizzler',
  'gyat',
  'tweaking',
  'zaddy',
  'yassify',
  'gaslight',
  'aura',
  'aight',
  'boujee',
  'epic',
  'crusty',
  'snatched',
  'delulu',
  'unbothered',
  'demure',
  'awkward',
  'drama',
  'amped',
  'nerdy',
  'yassed',
  'dweeb',
  'banger',
  'retro',
  'oomf',
  'finna',
  'adorbs',
  'sketchy',
  'xoxo',
  'oomph',
  'homie',
  'queen',
  'quirky',
  'undercooked',
  'downbad',
  'dweeby',
  'yikers',
  'squad',
  'dime',
  'egirl',
  'mood',
  'kewl',
  'lame',
  'esketit',
  'tight',
  'turnt',
  'dead',
  'yappin',
  'zonked',
  'zooted',
  'wig',
  'woozy',
  'glowup',
  'hater',
  'icky',
  'juiced',
  'keen',
  'litty',
  'mad',
  'nerdcore',
  'outta',
  'posted',
  'raging',
  'random',
  'raw',
  'rowdy',
  'salt',
  'scrub',
  'shady',
  'sheesh',
  'shook',
  'side-eye',
  'slaps',
  'slick',
  'snitch',
  'spicy',
  'stacked',
  'stale',
  'stoked',
  'sugar',
  'swole',
  'tacky',
  'tender',
  'toxic',
  'trash',
  'trippy',
  'turnup',
  'unfazed',
  'vain',
  'valid',
  'vibes',
  'viral',
  'vixen',
  'warped',
  'weak',
  'weird',
  'wild',
  'yappy',
  'zappy',
  'kirk',
  'tung tung tung sahur',
  'blessed',
  'ahlie',
  'mandem',
  'tweaker',
  'tripping',
  'trippin',
  'cooked',
  'cracked',
  'mod',
  'brainrot',
  'joybait',
  'ragebait',
  'inter',
  'feeder',
  'mogged',
  'mogging',
  'abg',
  'abb',
  'milf',
  'dilf',
  'babygirl',
  'mommy',
  'baddie',
  'chopped',
  'farming',
  'bomboclatt',
  'bloodclatt',
  'pussyclatt',
  'buns',
  'memes',
  'chat',
  'chud',
  'chuzz',
  'huzz',
  'clanker',
  'computa',
  'copium',
  'crashout'
);