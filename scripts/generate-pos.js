const fs = require("fs");
const path = require("path");

function q(id, sentence, choices, choicePos, answer, explanation, trap, difficulty = 1) {
  if (!/^pos-\d{3}$/.test(id)) throw new Error("Bad id: " + id);
  if (!sentence.includes("_____")) throw new Error("Blank missing: " + id);
  if (!Array.isArray(choices) || choices.length !== 4) throw new Error("Choices must be 4: " + id);
  if (!Array.isArray(choicePos) || choicePos.length !== 4) throw new Error("choicePos must be 4: " + id);
  if (![0,1,2,3].includes(answer)) throw new Error("Answer must be 0..3: " + id);
  if (![1,2,3].includes(difficulty)) throw new Error("Difficulty must be 1..3: " + id);
  return { id, sentence, choices, choicePos, answer, explanation, trap, difficulty };
}

/**
 * 100 unique TOEIC-quality POS items
 * tuple: [sentence, choices[4], choicePos[4], answerIndex, explanation, trap, difficulty]
 */
const items = [
  // --- Verb forms / auxiliary / passive (1-20) ---
  ["The new policy will _____ effective next month.", ["be","being","been","is"], ["動詞（原形）","動名詞/現在分詞","過去分詞","be動詞（現在形）"], 0, "助動詞 will の後ろは動詞の原形 be。", "is は will と併用不可。", 1],
  ["All applicants must _____ the online form before applying.", ["complete","completed","completing","completion"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 0, "助動詞 must の後ろは原形。", "completion は名詞。", 1],
  ["The invoice was _____ to the customer this morning.", ["send","sending","sent","sender"], ["動詞（原形）","動名詞/現在分詞","過去分詞","名詞"], 2, "受動態（was）の後ろは過去分詞 sent。", "send は原形。", 1],
  ["The new software should be _____ on all company laptops.", ["install","installed","installing","installation"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞"], 1, "should be + 過去分詞で受動態。", "install は原形で受動にならない。", 1],
  ["The schedule has been _____ to reflect the latest changes.", ["update","updated","updating","updates"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞（複数）"], 1, "has been + 過去分詞で受動態。", "updates は名詞。", 2],
  ["The documents need to be _____ before noon.", ["sign","signed","signing","signature"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞"], 1, "need to be + 過去分詞で受動態。", "signature は名詞。", 1],
  ["Our IT team will _____ the issue within 24 hours.", ["resolve","resolved","resolving","resolution"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 0, "will の後ろは動詞原形。", "resolution は名詞。", 1],
  ["The client has _____ the contract electronically.", ["sign","signed","signing","signature"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞"], 1, "現在完了 has + 過去分詞。", "sign は原形。", 2],
  ["The training session is _____ for all new employees.", ["require","required","requirement","requiring"], ["動詞","形容詞（過去分詞）","名詞","動名詞/現在分詞"], 1, "be動詞の後ろは状態（形容詞）required。", "requirement は名詞。", 1],
  ["The shipment is expected to _____ tomorrow morning.", ["arrive","arrived","arriving","arrival"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 0, "to の後ろは動詞原形。", "arrival は名詞。", 1],
  ["The meeting was _____ due to a power outage.", ["cancel","canceled","canceling","cancellation"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞"], 1, "be動詞（was）の後ろで受動/状態→過去分詞。", "cancellation は名詞。", 1],
  ["The manager asked the team to _____ the proposal.", ["revise","revised","revising","revision"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 0, "to の後ろは原形。", "revision は名詞。", 1],
  ["The new employee is still _____ how to use the system.", ["learn","learned","learning","learner"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 2, "be動詞 + 動名詞/現在分詞で進行形。", "learner は名詞。", 2],
  ["The device stopped _____ after the update.", ["work","worked","working","worker"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 2, "stop + 動名詞で『〜するのをやめる』。", "work は原形で不自然。", 2],
  ["The board plans to _____ a decision next week.", ["make","made","making","maker"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 0, "to の後ろは原形。", "made は過去形。", 1],
  ["The package must _____ with care.", ["handle","handled","handling","handler"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞"], 0, "must の後ろは原形。※受動なら be handled。ここは能動表現。", "handled は形が合わない。", 2],
  ["The proposal was _____ by the committee yesterday.", ["review","reviewed","reviewing","review"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞/動詞"], 1, "受動態（was）の後ろは過去分詞 reviewed。", "review は原形/名詞。", 1],
  ["The new system will be _____ in phases.", ["introduce","introduced","introducing","introduction"], ["動詞（原形）","過去分詞","動名詞/現在分詞","名詞"], 1, "will be + 過去分詞で受動態。", "introduction は名詞。", 2],
  ["The customer requested that we _____ the delivery address.", ["confirm","confirmed","confirming","confirmation"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 0, "request that S + 動詞原形（仮定法現在）。", "confirmed は過去形。", 3],
  ["The team has decided to _____ the conference online.", ["hold","held","holding","holder"], ["動詞（原形）","過去形/過去分詞","動名詞/現在分詞","名詞"], 0, "to の後ろは原形。", "held は過去形。", 1],

  // --- Adjective vs Adverb / word form (21-50) ---
  ["Please speak _____ during the presentation.", ["clear","clearly","clarity","clearness"], ["形容詞","副詞","名詞","名詞"], 1, "動詞 speak を修飾するのは副詞。", "clear は形容詞。", 1],
  ["The instructions were _____ written and easy to follow.", ["careful","carefully","care","careless"], ["形容詞","副詞","名詞/動詞","形容詞"], 1, "written を修飾→副詞 carefully。", "careful は形容詞。", 1],
  ["The manager was _____ satisfied with the results.", ["complete","completely","completion","completing"], ["形容詞","副詞","名詞","動名詞/現在分詞"], 1, "satisfied（形容詞）を修飾→副詞 completely。", "complete は形容詞。", 1],
  ["The brochure provides _____ information about the service.", ["detail","detailed","details","detailing"], ["名詞/動詞","形容詞（過去分詞）","名詞（複数）","動名詞/現在分詞"], 1, "information を修飾→形容詞 detailed。", "details は名詞。", 1],
  ["The assistant answered the phone _____ .", ["polite","politely","politeness","politest"], ["形容詞","副詞","名詞","形容詞（最上級）"], 1, "answered を修飾→副詞 politely。", "polite は形容詞。", 1],
  ["Our website was updated _____ to improve navigation.", ["recent","recently","recency","recenter"], ["形容詞","副詞","名詞","動詞"], 1, "updated（動詞）を修飾→副詞 recently。", "recent は形容詞。", 1],
  ["The company offers _____ benefits to its employees.", ["attract","attractive","attractively","attraction"], ["動詞","形容詞","副詞","名詞"], 1, "benefits を修飾→形容詞 attractive。", "attraction は名詞。", 1],
  ["The proposal was _____ reviewed by the legal team.", ["thorough","thoroughly","thoroughness","through"], ["形容詞","副詞","名詞","前置詞"], 1, "reviewed を修飾→副詞 thoroughly。", "thorough は形容詞。", 1],
  ["The new logo is _____ similar to the previous design.", ["remarkable","remarkably","remark","remarks"], ["形容詞","副詞","名詞/動詞","名詞（複数）"], 1, "similar（形容詞）を修飾→副詞 remarkably。", "remarkable は形容詞。", 2],
  ["We need a _____ solution to reduce costs.", ["practice","practical","practically","practiced"], ["名詞/動詞","形容詞","副詞","形容詞（過去分詞）"], 1, "solution を修飾→形容詞 practical。", "practically は副詞。", 1],
  ["The speaker delivered a _____ presentation.", ["convince","convincing","convincingly","conviction"], ["動詞","形容詞（現在分詞）","副詞","名詞"], 1, "presentation を修飾→形容詞 convincing。", "convincingly は副詞。", 1],
  ["The customer was _____ about the delayed shipment.", ["angry","angrily","anger","angered"], ["形容詞","副詞","名詞","過去分詞"], 0, "be動詞の後ろは形容詞 angry。", "angrily は副詞。", 1],
  ["The staff handled the complaint _____ .", ["professional","professionally","profession","professionalism"], ["形容詞","副詞","名詞","名詞"], 1, "handled を修飾→副詞 professionally。", "professional は形容詞。", 1],
  ["The new policy is _____ to all departments.", ["apply","applicable","application","applied"], ["動詞","形容詞","名詞","過去分詞"], 1, "be動詞の後ろで状態→形容詞 applicable。", "application は名詞。", 2],
  ["The meeting agenda was _____ organized.", ["good","well","better","best"], ["形容詞","副詞","比較級","最上級"], 1, "organized（動詞）を修飾→副詞 well。", "good は形容詞。", 1],
  ["The marketing campaign was _____ successful.", ["exceptional","exceptionally","exception","except"], ["形容詞","副詞","名詞","前置詞"], 1, "successful（形容詞）を修飾→副詞 exceptionally。", "exceptional は形容詞。", 1],
  ["The company has a _____ reputation for customer service.", ["rely","reliable","reliably","reliability"], ["動詞","形容詞","副詞","名詞"], 1, "reputation を修飾→形容詞 reliable。", "reliability は名詞。", 2],
  ["We appreciate your _____ cooperation.", ["kind","kindly","kindness","kinder"], ["形容詞","副詞","名詞","比較級"], 0, "cooperation を修飾→形容詞 kind。", "kindly は副詞。", 1],
  ["The report contains _____ data from last quarter.", ["value","valuable","valuably","valuation"], ["名詞/動詞","形容詞","副詞","名詞"], 1, "data を修飾→形容詞 valuable。", "value は名詞。", 1],
  ["The technician explained the procedure _____ .", ["patient","patiently","patience","patients"], ["形容詞","副詞","名詞","名詞（複数）"], 1, "explained を修飾→副詞 patiently。", "patient は形容詞。", 1],
  ["The store was _____ crowded during the sale.", ["extreme","extremely","extremity","extremism"], ["形容詞","副詞","名詞","名詞"], 1, "crowded（形容詞）を修飾→副詞 extremely。", "extreme は形容詞。", 1],
  ["The manager made a _____ decision to expand overseas.", ["quick","quickly","quickness","quicken"], ["形容詞","副詞","名詞","動詞"], 0, "decision を修飾→形容詞 quick。", "quickly は副詞。", 1],
  ["The instructions were followed _____ .", ["exact","exactly","exactness","exactitude"], ["形容詞","副詞","名詞","名詞"], 1, "followed を修飾→副詞 exactly。", "exact は形容詞。", 1],
  ["The company achieved _____ growth in Asia.", ["steady","steadily","steadiness","stead"], ["形容詞","副詞","名詞","名詞"], 0, "growth を修飾→形容詞 steady。", "steadily は副詞。", 1],
  ["Our sales increased _____ after the promotion.", ["significant","significantly","significance","signify"], ["形容詞","副詞","名詞","動詞"], 1, "increased を修飾→副詞 significantly。", "significant は形容詞。", 1],
  ["The employee responded _____ to the feedback.", ["positive","positively","positivity","position"], ["形容詞","副詞","名詞","名詞"], 1, "responded を修飾→副詞 positively。", "positive は形容詞。", 1],
  ["The plan is _____ realistic given the budget.", ["high","highly","height","heighten"], ["形容詞","副詞","名詞","動詞"], 1, "realistic（形容詞）を修飾→副詞 highly。", "high は形容詞。", 2],
  ["The staff were _____ trained to handle emergencies.", ["proper","properly","property","propriety"], ["形容詞","副詞","名詞","名詞"], 1, "trained を修飾→副詞 properly。", "proper は形容詞。", 1],
  ["The conference room was _____ available on short notice.", ["immediate","immediately","immediacy","mediate"], ["形容詞","副詞","名詞","動詞"], 1, "available（形容詞）を修飾→副詞 immediately。", "immediate は形容詞。", 2],

  // --- Prepositions / collocations (51-75) ---
  ["Employees must submit their requests _____ Friday.", ["until","by","during","while"], ["前置詞","前置詞","前置詞","接続詞"], 1, "期限は by + 日付。", "while は接続詞。", 1],
  ["The package was delivered _____ Mr. Tanaka yesterday.", ["to","for","with","by"], ["前置詞","前置詞","前置詞","前置詞"], 3, "受動態の動作主は by。", "to は宛先。", 2],
  ["Please reply _____ this email by noon.", ["for","to","at","with"], ["前置詞","前置詞","前置詞","前置詞"], 1, "reply to が定型。", "reply with は不自然。", 2],
  ["The conference will be held _____ the main auditorium.", ["in","at","on","by"], ["前置詞","前置詞","前置詞","前置詞"], 0, "会場（空間）の中→ in。", "on は面。", 2],
  ["The train arrives _____ 7:30 p.m.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 2, "時刻は at。", "by は『〜までに』。", 1],
  ["The seminar will take place _____ Monday morning.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 1, "曜日は on。", "in は月・年。", 1],
  ["The office is located _____ the third floor.", ["in","on","at","to"], ["前置詞","前置詞","前置詞","前置詞"], 1, "階は on the third floor。", "in は空間内。", 1],
  ["The documents were prepared _____ advance.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 0, "in advance は定型。", "on advance は誤り。", 2],
  ["The schedule was changed _____ short notice.", ["at","in","on","for"], ["前置詞","前置詞","前置詞","前置詞"], 2, "on short notice が定型。", "at short notice は不可。", 2],
  ["The manager will be in Tokyo _____ three days.", ["since","for","during","by"], ["前置詞/接続詞","前置詞","前置詞","前置詞"], 1, "期間は for + 期間。", "since は起点。", 1],
  ["We have been working _____ this project since July.", ["at","on","in","to"], ["前置詞","前置詞","前置詞","前置詞"], 1, "work on が定型。", "work in は場所。", 2],
  ["The customer complained _____ the delay in shipping.", ["about","to","for","with"], ["前置詞","前置詞","前置詞","前置詞"], 0, "complain about + 事柄。", "complain to は相手。", 2],
  ["The speaker apologized _____ the mistake.", ["for","to","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 0, "apologize for + 事柄。", "to は相手。", 2],
  ["The team is responsible _____ updating the website.", ["for","to","with","at"], ["前置詞","前置詞","前置詞","前置詞"], 0, "responsible for が定型。", "responsible to は意味が違う。", 2],
  ["The manager agreed _____ the client’s request.", ["to","with","on","at"], ["前置詞","前置詞","前置詞","前置詞"], 1, "agree with + 人/意見。", "agree to は提案/計画。", 3],
  ["Please send the invoice _____ email.", ["by","with","on","from"], ["前置詞","前置詞","前置詞","前置詞"], 0, "手段は by email。", "with email は不自然。", 2],
  ["The price depends _____ the size of the order.", ["in","on","at","to"], ["前置詞","前置詞","前置詞","前置詞"], 1, "depend on が定型。", "depend in は不可。", 2],
  ["The meeting will start _____ time, so please be punctual.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 1, "on time が定型。", "in time は『間に合って』。", 2],
  ["The receptionist will be back _____ a few minutes.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 0, "in + 時間で『〜後に』。", "by は期限。", 2],
  ["The documents are available _____ request.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 1, "on request が定型。", "by request は不可。", 2],
  ["Please fill out the form _____ ink.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 0, "in ink（インクで）が定型。", "by ink は不可。", 2],
  ["The equipment was purchased _____ a discount.", ["at","in","on","by"], ["前置詞","前置詞","前置詞","前置詞"], 0, "at a discount が定型。", "in a discount は誤り。", 2],
  ["The new branch will open _____ April 1.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 1, "日付は on。", "in は月・年。", 1],
  ["The email was sent _____ error to all customers.", ["in","by","with","on"], ["前置詞","前置詞","前置詞","前置詞"], 1, "by error（誤って）が定型。", "in error は別表現だがTOEICでは by error が多い。", 3],
  ["The office will be closed _____ national holidays.", ["in","on","at","by"], ["前置詞","前置詞","前置詞","前置詞"], 1, "on holidays が自然。", "in holidays は不自然。", 2],

  // --- Conjunction / clause structure (76-90) ---
  ["We will postpone the launch _____ we receive final approval.", ["because","until","despite","during"], ["接続詞","接続詞","前置詞","前置詞"], 1, "後ろが文で『〜まで』→ until。", "during は名詞句向け。", 3],
  ["The printer stopped working _____ it ran out of ink.", ["because","because of","despite","during"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文なので because。", "because of は名詞句。", 2],
  ["_____ the traffic, we arrived on time.", ["Because","Because of","Although","While"], ["接続詞","前置詞","接続詞","接続詞"], 1, "名詞句 the traffic の前→ Because of。", "Because は文が必要。", 2],
  ["We will start the meeting on time _____ some members are late.", ["because","although","because of","despite"], ["接続詞","接続詞","前置詞","前置詞"], 1, "後ろが文で逆接→ although。", "despite は名詞句向け。", 3],
  ["The event was canceled _____ the heavy rain.", ["although","because","because of","while"], ["接続詞","接続詞","前置詞","接続詞"], 2, "名詞句 the heavy rain → because of。", "because は文が必要。", 2],
  ["We will proceed with the plan _____ the budget is approved.", ["once","during","because of","despite"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文→接続詞 once（〜したら）。", "during は名詞句。", 3],
  ["Please call me _____ you arrive at the office.", ["when","during","because of","despite"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文で時→ when。", "during は名詞句。", 2],
  ["We cannot release the report _____ the director approves it.", ["unless","despite","during","because of"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文で条件→ unless。", "despite は名詞句。", 3],
  ["The manager will attend the meeting _____ he is in Osaka.", ["if","for","because of","during"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文で条件→ if。", "for は名詞句。", 2],
  ["_____ we finish the test, we will review the answers.", ["After","During","Because of","Despite"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文なので After（接続詞）。", "During は名詞句。", 3],
  ["The staff stayed late _____ they could finish the inventory.", ["so that","because of","despite","during"], ["接続詞","前置詞","前置詞","前置詞"], 0, "目的を表す接続詞 so that。", "because of は名詞句。", 3],
  ["The team worked overtime _____ the project was behind schedule.", ["because","because of","despite","during"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文→ because。", "because of は名詞句。", 2],
  ["The presentation was successful _____ the technical problems.", ["despite","although","because","while"], ["前置詞","接続詞","接続詞","接続詞"], 0, "名詞句 the technical problems の前→ despite。", "although は文が必要。", 3],
  ["_____ the meeting ended, the staff returned to work.", ["As soon as","During","Because of","Despite"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文→ as soon as。", "during は名詞句。", 3],
  ["We will not change the price _____ the contract is renewed.", ["unless","because of","despite","during"], ["接続詞","前置詞","前置詞","前置詞"], 0, "後ろが文で条件→ unless。", "because of は名詞句。", 3],

  // --- Pronouns / determiners / relative / quantity (91-100) ---
  ["Please contact _____ if you have any questions.", ["we","our","us","ours"], ["代名詞（主格）","所有格（形容詞的）","代名詞（目的格）","所有代名詞"], 2, "contact の目的語→ us。", "we は主格。", 1],
  ["_____ manager will review your application.", ["We","Us","Our","Ours"], ["代名詞（主格）","代名詞（目的格）","所有格（形容詞的）","所有代名詞"], 2, "manager を修飾→ our。", "ours は名詞の代用。", 1],
  ["The new software offers many features, and _____ are easy to use.", ["they","them","their","theirs"], ["代名詞（主格）","代名詞（目的格）","所有格（形容詞的）","所有代名詞"], 0, "are の主語→ they。", "them は目的格。", 2],
  ["The employee _____ submitted the report will receive a bonus.", ["who","whom","which","what"], ["関係代名詞（主格）","関係代名詞（目的格）","関係代名詞","疑問詞/関係詞"], 0, "submitted の主語→ who。", "whom は目的格。", 2],
  ["The report _____ you requested has been completed.", ["who","whom","which","where"], ["関係代名詞","関係代名詞","関係代名詞","関係副詞"], 2, "先行詞 report（物）→ which。", "where は場所。", 2],
  ["The applicant _____ resume impressed the team was hired.", ["who","whose","which","what"], ["関係代名詞","関係代名詞（所有）","関係代名詞","疑問詞/関係詞"], 1, "resume の所有を表す→ whose。", "who は所有を表せません。", 3],
  ["The new model is _____ expensive than the previous one.", ["more","most","many","much"], ["比較級","最上級","数量（可算）","数量（不可算）"], 0, "than がある比較→ more + 形容詞。", "most は最上級。", 1],
  ["There are _____ applicants this year than last year.", ["many","more","most","much"], ["数量（可算）","比較級","最上級","数量（不可算）"], 1, "than → 比較級 more。", "many は比較にならない。", 1],
  ["We received _____ information about the new procedure.", ["many","much","more","most"], ["数量（可算）","数量（不可算）","比較級","最上級"], 1, "information は不可算→ much。", "many は可算向け。", 1],
  ["Only a _____ of customers responded to the survey.", ["few","little","number","amount"], ["数量形容詞（可算）","数量形容詞（不可算）","名詞（可算）","名詞（不可算）"], 2, "a number of + 可算複数。", "amount は不可算向け。", 2]
];

// Build questions with IDs, ensure sentence uniqueness
const seenSentence = new Set();
const questions = items.map((it, idx) => {
  const id = `pos-${String(idx + 1).padStart(3, "0")}`;
  const [sentence, choices, choicePos, answer, explanation, trap, difficulty] = it;

  if (seenSentence.has(sentence)) throw new Error("Duplicate sentence found: " + sentence);
  seenSentence.add(sentence);

  return q(id, sentence, choices, choicePos, answer, explanation, trap, difficulty);
});

if (questions.length !== 100) throw new Error("Expected 100 items, got " + questions.length);

const outPath = path.join("public", "data", "questions", "pos.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), "utf8");
console.log("pos.json generated:", questions.length, "questions ->", outPath);
