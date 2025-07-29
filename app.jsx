import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
import confetti from "canvas-confetti";
const room = new WebsimSocket();
const MAX_APPLICANTS = 456;
const GAME_STATE_ID = "SQUID_GAME_V1";
function App() {
  const [currentUser, setCurrentUser] = useState(null);
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
      lineNumber: 74,
      columnNumber: 16
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen w-full flex flex-col items-center justify-center p-4 text-white", children: [
    /* @__PURE__ */ jsxDEV(Header, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 79,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-4xl mx-auto", children: [
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
          lineNumber: 81,
          columnNumber: 17
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(ApplicantList, { applicants }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 86,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 80,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Footer, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 78,
    columnNumber: 9
  }, this);
}
function LoadingScreen() {
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen w-full flex flex-col items-center justify-center gap-6", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "loader" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 96,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "text-xl text-gray-300 font-squid", children: "Connecting to the game..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 97,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 95,
    columnNumber: 9
  }, this);
}
function Header() {
  return /* @__PURE__ */ jsxDEV("header", { className: "text-center mb-8", children: [
    /* @__PURE__ */ jsxDEV("h1", { className: "text-5xl md:text-7xl font-squid", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "squid-pink", children: "SQUID" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 106,
        columnNumber: 17
      }, this),
      " ",
      /* @__PURE__ */ jsxDEV("span", { className: "squid-teal", children: "GAMES" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 106,
        columnNumber: 59
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 105,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "text-lg text-gray-400 mt-2", children: "The Websim Challenge" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 108,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 104,
    columnNumber: 9
  }, this);
}
function StatusBoard({ applicantCount, isFull, gameState }) {
  const competitionDate = gameState?.competition_start_utc ? new Date(gameState.competition_start_utc) : null;
  return /* @__PURE__ */ jsxDEV("div", { className: "card rounded-lg p-6 mb-8 text-center", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold font-squid mb-4", children: isFull ? "Registration Closed" : "Registration Open" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 118,
      columnNumber: 14
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "text-6xl font-bold my-4", children: [
      /* @__PURE__ */ jsxDEV("span", { className: isFull ? "squid-pink" : "squid-teal", children: applicantCount }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 122,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "text-3xl text-gray-500", children: [
        " / ",
        MAX_APPLICANTS
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 123,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 121,
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
        lineNumber: 126,
        columnNumber: 17
      },
      this
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 125,
      columnNumber: 13
    }, this),
    competitionDate && /* @__PURE__ */ jsxDEV(CountdownTimer, { targetDate: competitionDate }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 131,
      columnNumber: 33
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 117,
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
      lineNumber: 163,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center items-center gap-4 text-2xl font-bold", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.days || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Days" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 165,
          columnNumber: 44
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 165,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: ":" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 166,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.hours || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Hours" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 167,
          columnNumber: 45
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 167,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: ":" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 168,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.minutes || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Mins" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 169,
          columnNumber: 47
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 169,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: ":" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 170,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { children: [
        timeLeft.seconds || "0",
        /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-normal block", children: "Secs" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 171,
          columnNumber: 47
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 171,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 164,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 162,
    columnNumber: 9
  }, this);
}
function ApplicantList({ applicants }) {
  return /* @__PURE__ */ jsxDEV("div", { className: "card rounded-lg p-6", children: [
    /* @__PURE__ */ jsxDEV("h3", { className: "text-xl font-squid mb-4", children: "Registered Applicants" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 180,
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
          lineNumber: 184,
          columnNumber: 25
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-semibold truncate w-full", children: applicant.username }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 189,
        columnNumber: 25
      }, this),
      /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-gray-400", children: [
        "#",
        index + 1
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 190,
        columnNumber: 25
      }, this)
    ] }, applicant.id, true, {
      fileName: "<stdin>",
      lineNumber: 183,
      columnNumber: 21
    }, this)) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 181,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 179,
    columnNumber: 9
  }, this);
}
function Footer() {
  return /* @__PURE__ */ jsxDEV("footer", { className: "text-center mt-8 text-xs text-gray-500", children: [
    /* @__PURE__ */ jsxDEV("p", { children: "You have been automatically entered. There is no leaving the game." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 201,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { children: "Failure to connect on competition day will result in elimination." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 202,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 200,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 208,
  columnNumber: 13
}));
