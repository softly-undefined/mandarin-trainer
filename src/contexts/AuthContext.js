import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getUserVocabSets, createVocabSet } from '../services/vocabSetService';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);

            if (user) {
                // Call a helper function to check/create ExampleSet
                ensureExampleSet(user.uid);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signInWithGoogle
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 

async function ensureExampleSet(uid) {
    try {
        const existingSets = await getUserVocabSets(uid);

        if (!existingSets || existingSets.length === 0) {
            await createVocabSet(
                uid,
                "Lesson 6 Vocabulary",
                [
                    { character: "考卷", pinyin: "kao3 juan4", definition: "Exam paper" },
                    { character: "翻譯", pinyin: "fan1 yi4", definition: "Translate" },
                    { character: "扣分", pinyin: "kou4 fen1", definition: "Deduct points" },
                    { character: "祝詞", pinyin: "zhu3 ci2", definition: "Sentence subject" },
                    { character: "文法", pinyin: "wen2 fa3", definition: "Grammar" },
                    { character: "成", pinyin: "cheng2", definition: "To become" },
                    { character: "低", pinyin: "di1", definition: "To be low" },
                    { character: "題目", pinyin: "ti2 mu4", definition: "Subject" },
                    { character: "算是", pinyin: "suan4 shi4", definition: "To be considered as" },
                    { character: "了解", pinyin: "liao3 jie3", definition: "To understand" },
                    { character: "複習", pinyin: "fu4 xi2", definition: "Review" },
                    { character: "記住", pinyin: "ji4 zhu4", definition: "To remember" },
                    { character: "踢開", pinyin: "ti1 kai1", definition: "To kick away" },
                    { character: "心理學", pinyin: "xin1 li3 xue2", definition: "Psychology" },
                    { character: "爛", pinyin: "lan4", definition: "To be worn out" },
                    { character: "倒楣", pinyin: "dao3 mei2", definition: "To have bad luck" },
                    { character: "高中", pinyin: "gao1 zhong1", definition: "High school" },
                    { character: "自動自發", pinyin: "zi4 dong4 zi4 fa1", definition: "Self-motivated" },
                    { character: "如果", pinyin: "ru2 guo3", definition: "If" },
                    { character: "討論", pinyin: "tao3 lun4", definition: "To discuss" },
                    { character: "難過", pinyin: "nan2 guo4", definition: "To be sad" },
                    { character: "期末考", pinyin: "qi2 mo4 kao3", definition: "Final Exam" },
                    { character: "加油", pinyin: "jia1 you2", definition: "Cheer on" },
                    { character: "作業", pinyin: "zuo4 ye4", definition: "Homework" },
                    { character: "臉色", pinyin: "lian3 se4", definition: "Facial Expression" },
                    { character: "報告", pinyin: "bao4 gao4", definition: "To make report" },
                    { character: "查", pinyin: "cha2", definition: "To check" },
                    { character: "當", pinyin: "dang1", definition: "To work as" },
                    { character: "助教", pinyin: "zhu4 jiao4", definition: "Teaching Assistant" },
                    { character: "輕鬆", pinyin: "qing1 song1", definition: "To be relaxed" },
                    { character: "背書", pinyin: "bei4 shu1", definition: "To recite from memory" },
                    { character: "及格", pinyin: "ji2 ge2", definition: "To pass test" },
                    { character: "厲害", pinyin: "li4 hai4", definition: "To be fierce" },
                    { character: "死定了", pinyin: "si3 ding4 le", definition: "Will surely die" },
                    { character: "其實", pinyin: "qi2 shi2", definition: "Actually, in fact" },
                    { character: "寧可", pinyin: "ning2 ke3", definition: "Would sooner" },
                    { character: "無聊", pinyin: "wu2 liao2", definition: "To be bored" },
                    { character: "非。。。不可", pinyin: "fei1...bu4 ke3", definition: "Have to" },
                    { character: "想發", pinyin: "xiang3 fa3", definition: "Point of view" }
                ]
            );
            console.log("Lesson 6 Vocabulary created for new user.");
        } else {
            console.log("User already has sets, no need to create ExampleSet.");
        }
    } catch (error) {
        console.error("Error checking or creating Lesson 6 Vocabulary:", error);
    }
}

