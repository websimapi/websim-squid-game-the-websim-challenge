import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
import confetti from "canvas-confetti";
const room = new WebsimSocket();
const MAX_APPLICANTS = 456;
const GAME_STATE_ID = "SQUID_GAME_V1";
function PrizePool({ totalTips, prizePool }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "card rounded-lg p-6 mb-8 w-full", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold font-squid mb-4 text-center squid-teal", children: "Prize Pool" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 14,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-around items-center text-center", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("p", { className: "text-gray-400 text-sm", children: "Total Tips Contributed" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 17,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-3xl font-bold text-white", children: [
          totalTips.toLocaleString(),
          /* @__PURE__ */ jsxDEV("span", { className: "text-lg squid-teal", children: " credits" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 18,
            columnNumber: 94
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 18,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 16,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "h-16 w-px bg-gray-700" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 20,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("p", { className: "text-gray-400 text-sm", children: "Current Prize Pool" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 22,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-3xl font-bold text-squid-pink", children: [
          prizePool.toLocaleString(),
          /* @__PURE__ */ jsxDEV("span", { className: "text-lg", children: " credits" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 23,
            columnNumber: 99
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 23,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 21,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 15,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 13,
    columnNumber: 9
  }, this);
}
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [prizePool, setPrizePool] = useState({ totalTips: 0, pool: 0 });
  const { data: applicants, loading: applicantsLoading } = useQuery(
    room.query(`
            SELECT a.id, a.user_id, u.username 
            FROM public.applicants_v1 a 
            JOIN public.user u ON a.user_id = u.id
            ORDER BY a.created_at ASC
        `)
  );
  const { data: gameStateArr, loading: gameStateLoading } = useQuery(room.collection("game_state_v1").filter({ id: GAME_STATE_ID }));
  const gameState = gameStateArr?.[0];
  useEffect(() => {
    const fetchUser = async () => {
      const user = await window.websim.getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
    const fetchPrizePool = async () => {
      const project = await window.websim.getCurrentProject();
      if (!project) return;
      const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true&first=1000`);
      const data = await response.json();
      if (data.comments?.data) {
        const totalTipAmount = data.comments.data.reduce((sum, item) => {
          return sum + (item.comment.card_data?.credits_spent || 0);
        }, 0);
        setPrizePool({
          totalTips: totalTipAmount,
          pool: totalTipAmount / 4
        });
      }
    };
    fetchPrizePool();
    const handleNewComment = (event) => {
      const { comment } = event;
      if (comment?.card_data?.type === "tip_comment" && comment.card_data.credits_spent > 0) {
        const tipAmount = comment.card_data.credits_spent;
        setPrizePool((prev) => ({
          totalTips: prev.totalTips + tipAmount,
          pool: (prev.totalTips + tipAmount) / 4
        }));
      }
    };
    window.websim.addEventListener("comment:created", handleNewComment);
    return () => {
      window.websim.removeEventListener("comment:created", handleNewComment);
    };
  }, []);
  const { isRegistered, isFull, isLoading } = useMemo(() => ({
    isRegistered: currentUser && applicants?.some((a) => a.user_id === currentUser.id),
    isFull: applicants?.length >= MAX_APPLICANTS,
    isLoading: applicantsLoading || gameStateLoading || !currentUser
  }), [currentUser, applicants, applicantsLoading, gameStateLoading]);
  useEffect(() => {
    if (!currentUser || isRegistered || isFull || isLoading) return;
    const register = async () => {
      console.log(`Registering ${currentUser.username}...`);
      await room.collection("applicants_v1").upsert({
        id: currentUser.id,
        user_id: currentUser.id
      });
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    };
    register();
  }, [currentUser, isRegistered, isFull, isLoading]);
  useEffect(() => {
    if (isFull && !gameState?.competition_start_utc) {
      const setCompetitionDate = async () => {
        const startDate = /* @__PURE__ */ new Date();
        startDate.setDate(startDate.getDate() + 7);
        await room.collection("game_state_v1").upsert({
          id: GAME_STATE_ID,
          competition_start_utc: startDate.toISOString()
        });
        console.log("Competition date has been set!");
      };
      setCompetitionDate();
    }
  }, [isFull, gameState]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV(LoadingScreen, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 135,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen w-full flex flex-col items-center justify-center p-4 text-white", children: [
    /* @__PURE__ */ jsxDEV(Header, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 140,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-4xl mx-auto flex flex-col items-center", children: [
      /* @__PURE__ */ jsxDEV(PrizePool, { totalTips: prizePool.totalTips, prizePool: prizePool.pool }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 142,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV(
        StatusBoard,
        {
          applicantCount: applicants?.length || 0,
          isFull,
          gameState
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 143,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(ApplicantList, { applicants }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 148,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 141,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Footer, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 150,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 139,
    columnNumber: 9
  }, this);
}
function LoadingScreen() {
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen w-full flex flex-col items-center justify-center gap-6", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "loader" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 158,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "text-xl text-gray-300 font-squid", children: "Connecting to the game..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 159,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 157,
    columnNumber: 9
  }, this);
}
function Header() {
  return /* @__PURE__ */ jsxDEV("header", { className: "text-center mb-8", children: [
    /* @__PURE__ */ jsxDEV("h1", { className: "text-5xl md:text-7xl font-squid", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "squid-pink", children: "SQUID" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 168,
        columnNumber: 17
      }, this),
      " ",
      /* @__PURE__ */ jsxDEV("span", { className: "squid-teal", children: "GAMES" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 168,
        columnNumber: 59
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 167,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "text-lg text-gray-400 mt-2", children: "The Websim Challenge" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 170,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 166,
    columnNumber: 9
  }, this);
}
function StatusBoard({ applicantCount, isFull, gameState }) {
  const competitionDate = gameState?.competition_start_utc ? new Date(gameState.competition_start_utc) : null;
  return /* @__PURE__ */ jsxDEV("div", { className: "card rounded-lg p-6 mb-8 text-center w-full", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold font-squid mb-4", children: isFull ? "Registration Closed" : "Registration Open" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 180,
      columnNumber: 14
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "text-6xl font-bold my-4", children: [
      /* @__PURE__ */ jsxDEV("span", { className: isFull ? "squid-pink" : "squid-teal", children: applicantCount }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 184,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "text-3xl text-gray-500", children: [
        " / ",
        MAX_APPLICANTS
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 185,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 183,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700", children: /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: `h-full rounded-full ${isFull ? "bg-squid-pink" : "bg-squid-teal"}`,
        style: { width: `${applicantCount / MAX_APPLICANTS * 100}%` }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 188,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 187,
      columnNumber: 13
    }, this),
    competitionDate && /* @__PURE__ */ jsxDEV(CountdownTimer, { targetDate: competitionDate }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 193,
      columnNumber: 33
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 179,
    columnNumber: 9
  }, this);
}
function CountdownTimer({ targetDate }) {
  const calculateTimeLeft = () => {
    const difference = +targetDate - +/* @__PURE__ */ new Date();
    let timeLeft2 = {};
    if (difference > 0) {
      timeLeft2 = {
        days: Math.floor(difference / (1e3 * 60 * 60 * 24)),
        hours: Math.floor(difference / (1e3 * 60 * 60) % 24),
        minutes: Math.floor(difference / 1e3 / 60 % 60),
        seconds: Math.floor(difference / 1e3 % 60)
      };
    }
    return timeLeft2;
  };
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1e3);
    return () => clearTimeout(timer);
  });
  return /* @__PURE__ */ jsxDEV("div", { className: "mt-6", children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-squid squid-teal mb-2", children: "Competition Begins In:" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 225,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center items-center gap-4 text-2xl font-bold", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.days || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Days" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 227,
          columnNumber: 44
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 227,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: ":" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 228,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.hours || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Hours" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 229,
          columnNumber: 45
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 229,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: ":" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 230,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.minutes || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Mins" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 231,
          columnNumber: 47
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 231,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: ":" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 232,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.seconds || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Secs" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 233,
          columnNumber: 47
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 233,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 226,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 224,
    columnNumber: 9
  }, this);
}
function ApplicantList({ applicants }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "card rounded-lg p-6", children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-squid mb-4", children: "Registered Applicants" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 242,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4", children: applicants?.map((applicant, index) => /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center text-center p-2 bg-gray-900 rounded-md border border-gray-700", children: [
      /* @__PURE__ */ jsxDEV(
        "img",
        {
          src: `https://images.websim.com/avatar/${applicant.username}`,
          alt: applicant.username,
          className: "w-16 h-16 rounded-full mb-2 border-2 border-squid-teal"
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 246,
          columnNumber: 25
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-semibold truncate w-full", children: applicant.username }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 251,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-gray-400", children: [
        "#",
        index + 1
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 252,
        columnNumber: 25
      }, this)
    ] }, applicant.id, true, {
      fileName: "<stdin>",
      lineNumber: 245,
      columnNumber: 21
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 243,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 241,
    columnNumber: 9
  }, this);
}
function Footer() {
  return /* @__PURE__ */ jsxDEV("footer", { className: "text-center mt-8 text-xs text-gray-500", children: [
    /* @__PURE__ */ jsxDEV("p", { children: "You have been automatically entered. There is no leaving the game." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 263,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { children: "Failure to connect on competition day will result in elimination." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 264,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 262,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 270,
  columnNumber: 13
}));
