const triviaQuestions = [
    { q: "What is the capital of Kenya?", a: "nairobi" },
    { q: "What is 5 + 7?", a: "12" },
    { q: "Who is the owner of Death Core X?", a: "lord monk" },
    { q: "What color is the sky?", a: "blue" },
    { q: "How many days are in a week?", a: "7" }
];

module.exports = [
    { name: 'tictactoe', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return r('Tactical grid only available in groups!');
        r(`🎮 *TACTICAL GRID*\n\n1️⃣ | 2️⃣ | 3️⃣\n4️⃣ | 5️⃣ | 6️⃣\n7️⃣ | 8️⃣ | 9️⃣\n\nReply with coordinate (1-9) to deploy your ❌!`);
    }},
    { name: 'trivia', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        if (!g) return r('Trivia only available in groups!');
        const q = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
        st['activeTrivia_' + f] = q.a;
        sv();
        r(`🧠 *DATA INTERROGATION*\n\n${q.q}\n\n_First operative to reply with the correct data wins 200 credits!_`);
    }},
    { name: 'dare', execute: async (s, m, f, a, g, o, c, st, db, sv, r) => {
        const dares = ["Send your last photo.", "Text your crush right now.", "Say a joke out loud.", "Do 20 push-ups.", "Compliment the next person who messages."];
        r(`🔥 *DIRECTIVE*\n\n${dares[Math.floor(Math.random() * dares.length)]}`);
    }}
];
