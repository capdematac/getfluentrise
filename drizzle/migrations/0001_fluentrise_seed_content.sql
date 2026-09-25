-- ============ PLACEMENT BANK ============
insert into public.exercises (is_placement, type, level, skill, prompt, passage, options, answer, explanation, examples, tags, objective, position) values
(true,'multiple_choice','A2','grammar','She ____ to the office by bus every morning.',null,'["go","goes","going","is go"]','{"correct":"goes"}','Third-person singular present simple takes -s.','{"He catches the 7:40 train.","It rains a lot in April."}','{"present simple"}','Basic present simple',1),
(true,'multiple_choice','A2','vocabulary','I''d like to ____ a table for two, please.',null,'["book","take","make","put"]','{"correct":"book"}','"Book a table" is the standard collocation in a restaurant context.','{"We booked a table for eight o''clock."}','{"collocation"}','Everyday collocations',2),
(true,'multiple_choice','B1','grammar','If I ____ more time, I would learn another language.',null,'["have","had","will have","would have"]','{"correct":"had"}','Second conditional: if + past simple, would + infinitive.','{"If I had the money, I''d travel more."}','{"conditionals"}','Second conditional',3),
(true,'open_cloze','B1','use_of_english','Write one word in the gap: She has been working here ____ 2019.',null,'[]','{"accepted":["since"]}','"Since" marks a point in time with the present perfect; "for" marks duration.','{"I''ve lived here since March.","I''ve lived here for two years."}','{"prepositions","perfect aspect"}','Since vs for',4),
(true,'multiple_choice','B2','vocabulary','The report ____ serious doubts about the project''s viability.',null,'["raises","lifts","grows","rises"]','{"correct":"raises"}','"Raise doubts" is the fixed collocation; "rise" is intransitive and cannot take an object.','{"The audit raised doubts about the figures."}','{"collocation"}','Verb-noun collocation',5),
(true,'multiple_choice','B2','grammar','By the time we arrived, the meeting ____ .',null,'["had already finished","has already finished","was already finishing","already finished"]','{"correct":"had already finished"}','Past perfect marks the earlier of two past events.','{"The train had left before we got there."}','{"past perfect"}','Narrative tense sequence',6),
(true,'key_word_transformation','B2','use_of_english','Complete the second sentence so it means the same. Use no more than four words including PUT.
"They cancelled the concert because of the storm."
The concert ____ because of the storm.',null,'[]','{"accepted":["was put off","was called off"]}','"Put off" = postpone/cancel; the passive is required because the agent is unspecified.','{"The launch was put off until June."}','{"transformation","phrasal verbs"}','Key word transformation',7),
(true,'multiple_choice','C1','vocabulary','His argument, though elegant, rests on a ____ premise.',null,'["faulty","fallible","false-hearted","mistaken-up"]','{"correct":"faulty"}','"Faulty premise" is the established academic collocation; "fallible" describes people or judgement, not premises.','{"The model is built on a faulty premise."}','{"academic collocation"}','Precision at C1',8),
(true,'error_correction','C1','grammar','One word is wrong. Rewrite the sentence correctly: "Hardly we had sat down when the lecture began."',null,'[]','{"accepted":["Hardly had we sat down when the lecture began.","hardly had we sat down when the lecture began"]}','After the initial negative adverb "hardly", the subject and auxiliary invert.','{"No sooner had she spoken than the room fell silent."}','{"inversion"}','Negative inversion',9),
(true,'register_choice','C1','writing','You are writing to a professor you have never met. Which opening is most appropriate?',null,'["Hi there — quick question for you.","Dear Professor Almeida, I am writing to ask about your seminar.","Yo Professor, got a sec?","Professor. Answer me this."]','{"correct":"Dear Professor Almeida, I am writing to ask about your seminar."}','Unfamiliar, hierarchical academic contact calls for a formal salutation and an explicit statement of purpose.','{"Dear Dr Lang, I am writing with regard to your recent paper."}','{"register"}','Register control',10),
(true,'reading_mcq','C1','reading','What is the writer''s attitude to the reforms?','For all the fanfare accompanying its launch, the reform package amounts to little more than a reshuffling of existing commitments. Its authors are not insincere; they are simply constrained by a budget that nobody in the chamber is willing to defend out loud.','["Enthusiastic support","Sceptical but not hostile","Openly contemptuous","Wholly indifferent"]','{"correct":"Sceptical but not hostile"}','"Little more than a reshuffling" signals scepticism, while "not insincere" withholds moral condemnation.','{"The plan is, at best, a partial remedy."}','{"inference","attitude"}','Inferring attitude',11),
(true,'open_cloze','C2','use_of_english','Write one word in the gap: ____ for the intervention of a passer-by, the outcome would have been far worse.',null,'[]','{"accepted":["but"]}','"But for X" = if it had not been for X; a fixed hypothetical structure typical of C2 written English.','{"But for her steady hand, the deal would have collapsed."}','{"hypothetical","fixed structures"}','But for + noun',12),
(true,'multiple_choice','C2','vocabulary','Her praise was so extravagant that it ____ on parody.',null,'["bordered","verged","edged","brushed"]','{"correct":"verged"}','"Verge on" is the idiomatic pairing with an abstract extreme; "border on" also exists but takes no preposition change here — with "on" the natural choice in this register is "verged".','{"His confidence verged on arrogance."}','{"idiomatic precision"}','Near-synonym discrimination',13),
(true,'multiple_choice','C2','grammar','____ the evidence been available earlier, the inquiry would have reached a different conclusion.',null,'["If","Had","Should","Were"]','{"correct":"Had"}','Inverted third conditional: Had + subject + past participle replaces "If ... had".','{"Had we known, we would have acted."}','{"inversion","conditionals"}','Inverted conditionals',14),
(true,'reading_mcq','C2','reading','What does the writer imply about the committee?','The committee''s report is a masterpiece of load-bearing qualification. Every recommendation is hedged, every hedge is footnoted, and the footnotes, read closely, quietly withdraw the recommendation above them.','["It produced decisive guidance","It avoided committing to anything","It was poorly written","It disagreed with its own chair"]','{"correct":"It avoided committing to anything"}','The ironic praise plus "quietly withdraw" indicates evasion, not decisiveness.','{"The wording was careful to the point of emptiness."}','{"irony","inference"}','Reading irony',15),
(true,'register_choice','C2','writing','Which sentence is the most natural formal reformulation of "We didn''t do it because it cost too much."?',null,'["We didn''t proceed due to it being too expensive.","The initiative was not pursued on grounds of cost.","Cost was why not doing it happened.","It wasn''t pursued, cost-wise speaking."]','{"correct":"The initiative was not pursued on grounds of cost."}','Nominalisation plus the fixed phrase "on grounds of" produces natural formal prose.','{"The proposal was rejected on grounds of feasibility."}','{"nominalisation","register"}','Formal reformulation',16);

-- ============ MODULES ============
insert into public.modules (slug,title,subtitle,objective,level,position) values
('foundations','Foundations Refresher','A1–A2 essentials','Repair gaps in basic grammar, high-frequency vocabulary and everyday reading.','A2',1),
('consolidation','Intermediate Consolidation','B1 bridge','Firm up tense choice, everyday collocation and functional language before advanced work.','B1',2),
('b2-accuracy','Complex Accuracy','B2 entry point','Control complex sentences, phrasal verbs and natural word choice under pressure.','B2',3),
('c1-precision','Vocabulary Precision & Nuance','C1 core','Choose between near-synonyms, control collocation and read for implied meaning.','C1',4),
('c1-register','Register, Tone & Formality','C1 core','Move deliberately between formal, neutral and informal English.','C1',5),
('c2-discourse','Discourse & Argumentation','C2 focus','Organise extended argument: concession, hedging, cohesion and emphasis.','C2',6),
('c2-nuance','Nuance, Idiom & Ambiguity','C2 focus','Handle irony, connotation and ambiguity the way proficient users do.','C2',7);

-- ============ LESSONS ============
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Everyday present tenses','Habits, routines and states in the present simple and continuous.',8,1 from public.modules where slug='foundations';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'High-frequency word partners','The verb-noun pairs that make basic English sound natural.',8,2 from public.modules where slug='foundations';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Conditionals in ordinary use','Real and unreal conditions in everyday conversation.',10,1 from public.modules where slug='consolidation';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Perfect aspect without fear','Present perfect vs past simple, since vs for.',10,2 from public.modules where slug='consolidation';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Narrative tense sequencing','Ordering past events precisely with perfect and continuous forms.',12,1 from public.modules where slug='b2-accuracy';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Phrasal verbs that carry meaning','Separable, inseparable and idiomatic multi-word verbs.',12,2 from public.modules where slug='b2-accuracy';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Sounding natural, not merely correct','Choosing the sentence a proficient speaker would actually produce.',12,3 from public.modules where slug='b2-accuracy';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Near-synonyms under pressure','Reticence, reluctance, resignation: choosing the exact word.',14,1 from public.modules where slug='c1-precision';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Academic and professional collocation','The verb-noun pairs of reports, papers and meetings.',14,2 from public.modules where slug='c1-precision';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Reading for implied meaning','Attitude, stance and what the writer declines to say.',14,3 from public.modules where slug='c1-precision';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Formal, neutral, informal','The same message across three registers.',12,1 from public.modules where slug='c1-register';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Hedging and mitigation','Saying less than you mean, on purpose.',12,2 from public.modules where slug='c1-register';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Concession and counter-argument','Conceding ground without losing the argument.',15,1 from public.modules where slug='c2-discourse';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Cohesion, emphasis and inversion','Front-loading, cleft sentences and marked word order.',15,2 from public.modules where slug='c2-discourse';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Nominalisation and formal density','Compressing argument into noun phrases.',15,3 from public.modules where slug='c2-discourse';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Irony, understatement and connotation','Reading tone where the words say the opposite.',15,1 from public.modules where slug='c2-nuance';
insert into public.lessons (module_id,title,summary,est_minutes,position)
select id,'Idiom and figurative meaning','Fixed expressions used as a proficient writer uses them.',15,2 from public.modules where slug='c2-nuance';
