import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { courseListJsonLd } from "@/config/site";
import { useEnrollModal } from "@/contexts/EnrollModalContext";
import { Button } from "@/components/ui/button";
import {
  BookOpen, BrainCircuit, GraduationCap, Users, Clock, ArrowRight,
  Star, Zap, Target, Ear, Layers, Award, Trophy, Rocket, Wind,
  ChevronRight, Sparkles, Heart, Eye,
  Calculator, FlipHorizontal, Binary, Fingerprint, Lightbulb, Flame,
  Plane, Bike, CarFront, BadgeCheck, PartyPopper
} from "lucide-react";

const CATEGORIES = ["All Programs", "Abacus", "Vedic Maths", "Abacus Tutor Training", "Vedic Maths Tutor Training", "Corresponding Courses"];

const journeyCards = [
  {
    key: "beginners",
    title: "Beginners",
    age: "3–5 Years",
    image: "/images/journey/beginners-v2.webp",
    bg: "bg-violet-100",
    accent: "bg-violet-500",
    accentText: "text-violet-600",
    icon: Heart,
    description: "Introduces the very youngest learners to numbers through play, building curiosity and a love of learning before formal schooling begins.",
  },
  {
    key: "starters",
    title: "Starters",
    age: "5–6 Years",
    image: "/images/journey/starters-v2.webp",
    bg: "bg-yellow-100",
    accent: "bg-yellow-500",
    accentText: "text-yellow-700",
    icon: Lightbulb,
    description: "Foundation of the graded program. Children learn correct posture, bead identity, and sitting focus through joyful play-way exercises.",
  },
  {
    key: "movers",
    title: "Movers",
    age: "6–7 Years",
    image: "/images/journey/movers-v2.webp",
    bg: "bg-emerald-100",
    accent: "bg-emerald-500",
    accentText: "text-emerald-700",
    icon: Rocket,
    description: "Speed writing begins and visualization is activated. Children start encoding numbers as vivid mental images, engaging the right brain.",
  },
  {
    key: "riders",
    title: "Riders",
    age: "7–8 Years",
    image: "/images/journey/riders-v2.webp",
    bg: "bg-rose-100",
    accent: "bg-rose-500",
    accentText: "text-rose-700",
    icon: Bike,
    description: "Listening-based calculations sharpen auditory skills. Multi-digit problems are tackled with growing confidence and expanded visualization.",
  },
  {
    key: "racers",
    title: "Racers",
    age: "8–9 Years",
    image: "/images/journey/racers-v2.webp",
    bg: "bg-sky-100",
    accent: "bg-sky-500",
    accentText: "text-sky-700",
    icon: CarFront,
    description: "Fingering speed translates directly into faster mental calculations. Concentration strengthens appreciably and visualization range expands.",
  },
  {
    key: "flyers",
    title: "Flyers",
    age: "9–10 Years",
    image: "/images/journey/flyers-v2.webp",
    bg: "bg-orange-100",
    accent: "bg-orange-500",
    accentText: "text-orange-700",
    icon: Plane,
    description: "Multiplication joins addition and subtraction. The mental image bank grows rapidly, enabling competition-level accuracy and speed.",
  },
  {
    key: "endeavours",
    title: "Endeavours",
    age: "10–11 Years",
    image: "/images/journey/endeavours-v2.webp",
    bg: "bg-teal-100",
    accent: "bg-teal-600",
    accentText: "text-teal-700",
    icon: Flame,
    description: "Division is mastered and complex calculations deepen memory skills. Students develop near-pure mental arithmetic with pre-competition training.",
  },
  {
    key: "achievers",
    title: "Achievers",
    age: "11–12 Years",
    image: "/images/journey/achievers-v2.webp",
    bg: "bg-purple-100",
    accent: "bg-purple-600",
    accentText: "text-purple-700",
    icon: BadgeCheck,
    description: "Decimal sum calculations bring new challenges. Intensive practice simultaneously strengthens concentration and speed, with national-level competition preparation.",
  },
  {
    key: "stars",
    title: "Stars",
    age: "12–14 Years",
    image: "/images/journey/achievers-stars-v2.webp",
    bg: "bg-amber-100",
    accent: "bg-amber-500",
    accentText: "text-amber-700",
    icon: PartyPopper,
    blendMode: "multiply",
    description: "The pinnacle of the program. Peak speed in writing and mental calculations, decimal mastery, and Concentration, Visualization & Listening skills become lifelong abilities.",
  }
];

const programs = [
  /* ─── ABACUS LEVELS ─────────────────────────────────── */
  {
    id: "beginners",
    category: "Abacus",
    badge: "Beginner",
    badgeColor: "bg-orange-100 text-orange-700 border-orange-200",
    accentColor: "from-orange-400 to-amber-500",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    level: "B",
    icon: BookOpen,
    title: "Beginners",
    subtitle: "First Steps into Abacus",
    age: "5–6 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "The ideal starting point for children beginning their abacus journey. Students learn the fundamentals of the abacus tool — bead identity, column placement, basic finger technique — and develop the discipline and sitting practice essential for all future levels.",
    highlights: [
      "Introduction to the abacus and its construction",
      "Bead identification — Upper bead (5) and Lower bead (1)",
      "Column values — ones, tens, hundreds",
      "Correct finger technique for bead movement",
      "Single-digit addition and subtraction on abacus",
      "Sitting posture, discipline, and focus training",
      "Play-way activities to create genuine interest"
    ],
    skills: ["Bead ID", "Finger Technique", "Column Values", "Discipline"]
  },
  {
    id: "starters",
    category: "Abacus",
    badge: "Level 1",
    badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accentColor: "from-yellow-400 to-lime-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-700",
    level: "1",
    icon: Layers,
    title: "Starters",
    subtitle: "Foundation of Abacus Skill",
    age: "5–7 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "The entry point of the graded Indian Abacus program. Children learn correct body posture and how to hold the abacus and pencil properly. Play-way learning creates genuine interest and trains children to sit focused from day one.",
    highlights: [
      "Correct sitting posture — discipline inculcated",
      "Palms on table, Holding of Abacus & Pencil — prerequisites to skill-learning",
      "Introduced to play-way learning that creates genuine interest",
      "Children trained to sit focused for extended periods",
      "Basic bead value recognition on all columns",
      "Simple single-row addition using abacus",
      "Foundation exercises for concentration skills"
    ],
    skills: ["Discipline", "Focus", "Bead Basics", "Concentration"]
  },
  {
    id: "movers",
    category: "Abacus",
    badge: "Level 2",
    badgeColor: "bg-lime-100 text-lime-700 border-lime-200",
    accentColor: "from-lime-400 to-green-500",
    iconBg: "bg-lime-50",
    iconColor: "text-lime-700",
    level: "2",
    icon: Fingerprint,
    title: "Movers",
    subtitle: "Speed Writing & Visualization Begins",
    age: "6–7 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "Students advance to speed writing while maintaining quality. They start playing with numbers and are introduced to image-based visualization — activating the right hemisphere of the brain and beginning the journey toward mental arithmetic.",
    highlights: [
      "Speed Writing skill introduced — children learn to write fast and maintain quality",
      "Familiarize with numbers and playing with numbers",
      "Numbers related to images — visual memory encoding begins",
      "Introduced to Visualization (skill) — activation of the Right brain",
      "Two-digit addition and subtraction with carry",
      "Multi-row sums introduced",
      "Concentration exercises extended in duration"
    ],
    skills: ["Speed Writing", "Number Play", "Visualization", "Right Brain"]
  },
  {
    id: "riders",
    category: "Abacus",
    badge: "Level 3",
    badgeColor: "bg-teal-100 text-teal-700 border-teal-200",
    accentColor: "from-teal-400 to-cyan-500",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    level: "3",
    icon: Ear,
    title: "Riders",
    subtitle: "Listening Calculations & Multi-Digit",
    age: "7–8 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "Speed writing is strengthened further. Students are introduced to listening-based calculations that sharpen auditory processing and expand the calculation range to multiple digits and rows with more complex image visualizations.",
    highlights: [
      "Speed Writing skill strengthened further",
      "Playing with numbers in varying orders for flexibility",
      "Introduced to Listening-based calculations — improves listening skills",
      "More digits, more rows of numbers — expanded calculation range",
      "More images involved for enhanced visualization",
      "Visualization skill practice taken to next level",
      "Three-digit addition and subtraction"
    ],
    skills: ["Listening", "Multi-digit", "Visualization", "Speed Writing"]
  },
  {
    id: "racers",
    category: "Abacus",
    badge: "Level 4",
    badgeColor: "bg-sky-100 text-sky-700 border-sky-200",
    accentColor: "from-sky-400 to-blue-500",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-700",
    level: "4",
    icon: Zap,
    title: "Racers",
    subtitle: "Concentration & Fingering Speed",
    age: "8–9 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "Concentration skills strengthen appreciably at this stage. Increased fingering exercise speed directly translates to faster mental calculation, and visualization range expands significantly — students begin to handle more complex problem sets with confidence.",
    highlights: [
      "Concentration skills strengthen appreciably at this level",
      "Increased speed in Fingering Exercise",
      "Fingering speed results directly in calculation speed increase",
      "Visualization skills stretch further",
      "Visualization range increases significantly",
      "Complex multi-row, multi-digit mental sums",
      "Addition and subtraction with higher digit counts"
    ],
    skills: ["Concentration", "Fingering Speed", "Mental Math", "Extended Range"]
  },
  {
    id: "flyers",
    category: "Abacus",
    badge: "Level 5",
    badgeColor: "bg-violet-100 text-violet-700 border-violet-200",
    accentColor: "from-violet-400 to-purple-500",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    level: "5",
    icon: Wind,
    title: "Flyers",
    subtitle: "Multiplication & Image Bank Growth",
    age: "9–10 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "Students transition into multiplication alongside continued addition and subtraction of larger numbers. The visualization image bank grows rapidly, enabling faster mental recall and more accurate calculations with improved brain hemisphere synchronization.",
    highlights: [
      "Multiplication introduced and practised with abacus",
      "Subtraction and addition of larger multi-digit numbers",
      "Image bank grows — mental recall becomes faster",
      "Brain hemisphere synchronization deepens",
      "Increased listening sum complexity and speed",
      "Speed benchmarks assessed and targeted",
      "Competition-level problem exposure begins"
    ],
    skills: ["Multiplication", "Image Bank", "Brain Sync", "Speed Benchmarks"]
  },
  {
    id: "endeavours",
    category: "Abacus",
    badge: "Level 6",
    badgeColor: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    accentColor: "from-fuchsia-400 to-pink-500",
    iconBg: "bg-fuchsia-50",
    iconColor: "text-fuchsia-700",
    level: "6",
    icon: Target,
    title: "Endeavours",
    subtitle: "Complex Calculations & Memory Mastery",
    age: "10–11 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "More complicated calculations strengthen better concentration skills for faster and more accurate image manipulations. Memory skills strengthen further at this level, forming the foundation for the advanced stages that follow.",
    highlights: [
      "More complicated calculations — new challenges in concentration",
      "Practice strengthens concentration for faster, accurate image manipulation",
      "Memory skills strengthen further at this stage",
      "Division of numbers introduced",
      "Mental arithmetic transitions toward pure mind calculation",
      "Listening-based sums of greater complexity",
      "Pre-competition training and speed standards"
    ],
    skills: ["Complex Calculations", "Memory", "Division", "Image Accuracy"]
  },
  {
    id: "achievers",
    category: "Abacus",
    badge: "Level 7",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    accentColor: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    level: "7",
    icon: Award,
    title: "Achievers",
    subtitle: "Decimal Sums & Peak Listening",
    age: "11–12 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "Decimal sum calculations introduce new challenges to concentration and speed. Intensive practice at this level simultaneously strengthens both concentration and speed, while listening-based calculations reinforce auditory processing skills to peak performance.",
    highlights: [
      "Decimal sum calculations bring new challenges to concentration and speed",
      "Practice in the level strengthens both concentration and speed",
      "Listening-based calculations strengthen Listening skills",
      "Visualization accuracy at all-time high",
      "National-level competition preparation",
      "Cross-verification and checking techniques introduced",
      "Eligible for Global Grading Examination"
    ],
    skills: ["Decimals", "Peak Listening", "Competition Ready", "Accuracy"]
  },
  {
    id: "stars",
    category: "Abacus",
    badge: "Level 8 — Master",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
    accentColor: "from-yellow-400 to-amber-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-700",
    level: "8",
    icon: Star,
    title: "Stars",
    subtitle: "Mastery — Lifelong Mental Skills",
    age: "12–14 Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "The pinnacle of the abacus program. Speed in writing and mental calculations reaches its peak. Division sums bring fresh challenges, and the student emerges with Concentration, Visualization, and Listening skills that are made into lifelong abilities.",
    highlights: [
      "Speed in writing and speed in calculations reach a peak",
      "Division sums bring in new challenges and are mastered",
      "Over all Concentration, Visualization and Listening skills strengthen further",
      "Students become highly skilled — skills could be practised and made Life time skills",
      "Eligible for Global Grading Examination (GGE)",
      "Level Completion Certificate and Master Certificate awarded",
      "National competition and world record eligibility"
    ],
    skills: ["Mastery", "Lifetime Skills", "GGE Eligible", "Peak Speed"]
  },

  /* ─── VEDIC MATHS ───────────────────────────────────── */
  {
    id: "vedic-starters",
    category: "Vedic Maths",
    badge: "Level 1",
    badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accentColor: "from-yellow-400 to-lime-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-700",
    level: "V1",
    icon: Lightbulb,
    title: "Starters",
    subtitle: "Vedic Maths — Level 1",
    age: "8+ Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "The entry level of Vedic Mathematics. Students are introduced to ancient Indian mathematical techniques that make arithmetic fast, intuitive, and mentally stimulating. Core sutras for addition and subtraction are covered.",
    highlights: [
      "Introduction to Vedic Mathematics and its sutras",
      "Ancient Indian methods for fast mental arithmetic",
      "Core sutras for addition and subtraction",
      "Building number sense and mental agility",
      "Foundations of the Ekadhikena Purvena sutra",
      "Pattern recognition in numbers",
      "Developing confidence with mental calculations"
    ],
    skills: ["Vedic Sutras", "Mental Math", "Addition", "Pattern Recognition"]
  },
  {
    id: "vedic-movers",
    category: "Vedic Maths",
    badge: "Level 2",
    badgeColor: "bg-lime-100 text-lime-700 border-lime-200",
    accentColor: "from-lime-400 to-green-500",
    iconBg: "bg-lime-50",
    iconColor: "text-lime-700",
    level: "V2",
    icon: Rocket,
    title: "Movers",
    subtitle: "Vedic Maths — Level 2",
    age: "9+ Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "Students progress to multiplication techniques using Vedic sutras. The Nikhilam and Anurupyena methods are introduced, enabling students to multiply large numbers mentally at impressive speeds.",
    highlights: [
      "Vedic multiplication techniques — Nikhilam sutra",
      "Squaring numbers using Vedic shortcuts",
      "Anurupyena sutra for proportional multiplication",
      "Mental multiplication of 2-digit and 3-digit numbers",
      "Speed calculation exercises and drills",
      "Application of sutras to real-world problems",
      "Competitive mathematics preparation"
    ],
    skills: ["Multiplication", "Nikhilam", "Squaring", "Speed Calculation"]
  },
  {
    id: "vedic-riders",
    category: "Vedic Maths",
    badge: "Level 3",
    badgeColor: "bg-teal-100 text-teal-700 border-teal-200",
    accentColor: "from-teal-400 to-cyan-500",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-700",
    level: "V3",
    icon: Target,
    title: "Riders",
    subtitle: "Vedic Maths — Level 3",
    age: "10+ Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "Division and advanced multiplication are mastered through Vedic techniques. Students apply the Paravartya and Dhvajanka sutras for elegant division methods that eliminate lengthy steps from traditional arithmetic.",
    highlights: [
      "Vedic division using Paravartya sutra",
      "Dhvajanka method for complex division",
      "Advanced squaring and cubing techniques",
      "Divisibility rules through Vedic lens",
      "Mixed operations at speed",
      "Problem solving using multiple sutras",
      "Algebra foundations through Vedic approach"
    ],
    skills: ["Division", "Paravartya", "Cubing", "Advanced Operations"]
  },
  {
    id: "vedic-racers",
    category: "Vedic Maths",
    badge: "Level 4",
    badgeColor: "bg-sky-100 text-sky-700 border-sky-200",
    accentColor: "from-sky-400 to-blue-500",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-700",
    level: "V4",
    icon: Zap,
    title: "Racers",
    subtitle: "Vedic Maths — Level 4",
    age: "11+ Years",
    duration: "5 Months",
    sessions: "2 per week",
    description: "The advanced level of Vedic Maths where students master complex calculations with decimals, fractions, and algebraic operations using Vedic sutras. Students emerge with competition-level mental calculation speed.",
    highlights: [
      "Decimal and fraction operations through Vedic methods",
      "Algebraic expressions using Vedic sutras",
      "Simultaneous equations — Vedic approach",
      "Advanced squaring, cubing, and roots",
      "Competition-level speed calculation practice",
      "Integration of multiple sutras for complex problems",
      "Olympiad and competitive exam readiness"
    ],
    skills: ["Decimals", "Algebra", "Roots", "Competition Ready"]
  },

  /* ─── SKILL PROGRAMS ────────────────────────────────── */
  {
    id: "mathskills",
    category: "Vedic Maths Tutor Training",
    badge: "Skill Program",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    accentColor: "from-indigo-500 to-blue-600",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    level: null,
    icon: Calculator,
    title: "Math Skills",
    subtitle: "Speed Mathematics & Brain Training",
    age: "6–14 Years",
    duration: "5 Months",
    sessions: "Flexible",
    description: "A dedicated speed-mathematics and brain-training program. According to science, the human brain functions best through mathematical stimulation. This program uses numbers, shapes, logic, quantity, and arrangements to enhance IQ and cognitive development from an early age.",
    highlights: [
      "Speed mathematics training — maths sums at high pace",
      "Listening skills integrated into every math session",
      "Brain function enhancement through number science",
      "Logic, shapes, quantity, and spatial arrangements",
      "Elevates baby's IQ and enhances cognitive development",
      "Math is the study of numbers and their real-world relationships",
      "Olympiad and competitive exam readiness"
    ],
    skills: ["Speed Math", "Listening", "Logic & IQ", "Olympiad Prep"]
  },

  /* ─── LEARNING TOOLS ────────────────────────────────── */
  {
    id: "identify-bead",
    category: "Abacus Tutor Training",
    badge: "Interactive Tool",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accentColor: "from-emerald-400 to-teal-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    level: null,
    icon: Eye,
    title: "Identify Bead Values",
    subtitle: "Flash Card — Bead & Number Recognition",
    age: "All Levels",
    duration: "Practice Tool",
    sessions: "Self-paced",
    description: "An interactive flash card training module that tests and builds a student's ability to instantly identify bead positions and their corresponding numerical values. Covers both directions — Bead to Number and Number to Bead — for complete fluency.",
    highlights: [
      "Identify the Bead value and enter the correct numbers",
      "Image Flash cards — rapid visual recognition",
      "Multi-digit bead configurations (2-digit, 4-digit, and more)",
      "Dual-mode practice: Bead to Number & Number to Bead",
      "Timed exercises to build speed and accuracy",
      "Tracks progress and improvement over sessions",
      "Suitable for all levels from Starters to Stars"
    ],
    skills: ["Bead Recognition", "Visual Speed", "Accuracy", "Dual Mode"]
  },
  {
    id: "flash-bead-number",
    category: "Abacus Tutor Training",
    badge: "Flash Card",
    badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
    accentColor: "from-cyan-400 to-sky-500",
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-700",
    level: null,
    icon: Binary,
    title: "Flash Cards (Bead to Numbers)",
    subtitle: "Identify the Bead Value",
    age: "All Levels",
    duration: "Practice Tool",
    sessions: "Self-paced",
    description: "A focused flash card exercise where students are shown abacus bead configurations and must identify the correct numerical value. Trains the eye and mind to instantly decode bead positions into numbers — a critical mental arithmetic skill.",
    highlights: [
      "Shown an abacus bead image — must identify the number",
      "Multi-column bead configurations across all digit ranges",
      "Timed flash exposure builds instant recognition speed",
      "Builds the bridge between physical beads and mental images",
      "Progresses from single-digit to multi-digit configurations",
      "Core practice for visualization and mental abacus training",
      "Essential for Levels 3–8 speed development"
    ],
    skills: ["Bead → Number", "Visual Recall", "Speed Recognition", "Mental Bridge"]
  },
  {
    id: "flash-number-bead",
    category: "Abacus Tutor Training",
    badge: "Flash Card",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    accentColor: "from-blue-400 to-indigo-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    level: null,
    icon: FlipHorizontal,
    title: "Flash Cards (Number to Bead)",
    subtitle: "Identify the Flash Card Value",
    age: "All Levels",
    duration: "Practice Tool",
    sessions: "Self-paced",
    description: "The reverse flash card exercise — a number is displayed and students must mentally construct the correct bead configuration on the abacus. Reinforces the mental model of abacus bead placement, strengthening the right brain's visualization ability.",
    highlights: [
      "Shown a number — must identify the correct bead configuration",
      "Reinforces mental construction of abacus bead positions",
      "Strengthens right-brain visualization and spatial reasoning",
      "Single and multi-digit number-to-bead mapping",
      "Timed sessions to build mental encoding speed",
      "Complements Bead-to-Number practice for complete fluency",
      "Directly supports Mind Calculation skill development"
    ],
    skills: ["Number → Bead", "Spatial Reasoning", "Right Brain", "Visualization"]
  },

  /* ─── SPECIAL PROGRAMS ──────────────────────────────── */
  {
    id: "pregnant-mothers",
    category: "Corresponding Courses",
    badge: "Workshop",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
    accentColor: "from-rose-400 to-pink-500",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    level: null,
    icon: Heart,
    title: "Pregnant Mothers",
    subtitle: "Prenatal Cognitive Stimulation Workshop",
    age: "Expecting Mothers",
    duration: "Workshop Series",
    sessions: "Regular workshops",
    description: "A unique workshop program — \"The Genius of Your Child's Development\" — designed for pregnant mothers. Scientific evidence shows that prenatal exposure to mathematical stimulation and structured learning environments positively shapes the cognitive development of the unborn child.",
    highlights: [
      "Prenatal cognitive stimulation for the unborn child",
      "\"The Genius of Your Child's Development\" workshop series",
      "Based on scientific research into prenatal brain development",
      "Number and math exposure during pregnancy",
      "Abacus sounds and rhythm for in-womb stimulation",
      "Guidance on post-birth early learning environment",
      "Empowers mothers with knowledge of child brain development"
    ],
    skills: ["Prenatal Stimulation", "Brain Development", "Early Learning", "Cognitive Boost"]
  },
  {
    id: "more-features",
    category: "Corresponding Courses",
    badge: "Product Features",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    accentColor: "from-slate-500 to-gray-600",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    level: null,
    icon: Sparkles,
    title: "More Features",
    subtitle: "Salient Features of the Indian Abacus",
    age: "All Programs",
    duration: "Product Feature",
    sessions: "Integrated in all levels",
    description: "The Indian Abacus is engineered with four salient product features that make it vastly superior to conventional abacus tools — enabling stress-free, error-free, and faster learning for every student from Beginner to Master level.",
    highlights: [
      "The Sliders Stay Put — values don't change when abacus is vertical, giving firm, stable, perfect answers",
      "Unhide and Hide the Colour Images — student can show/hide color images, making visualization stronger, faster, stress-free and error-free",
      "Stress Free View — colour and non-colour positions remove confusion; memory registry becomes easier",
      "Zero Value Positions — slider positions show colours that make zero-value positions logically clear and always visible",
      "Superior to conventional abacus in every design dimension",
      "ISO 9001:2015 certified product quality",
      "Patented and trademark-protected innovation"
    ],
    skills: ["Sliders Stay Put", "Colour Images", "Stress-Free", "Zero Value View"]
  }
];

export function Courses() {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || "All Programs";
  });
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    if (cat) {
      setActiveCategory(cat);
      setTimeout(() => {
        const el = document.getElementById("programs-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }
    const hash = location.hash.replace("#", "");
    if (!hash) return;

     // Category hash — activate the matching filter tab and scroll to programs
    const categoryMap = {
      "abacus": "Abacus",
      "vedic-maths": "Vedic Maths",
      "abacus-tutor-training": "Abacus Tutor Training",
      "vedic-maths-tutor-training": "Vedic Maths Tutor Training",
      "corresponding-courses": "Corresponding Courses",
    };
    if (categoryMap[hash]) {
      setActiveCategory(categoryMap[hash]);
      setTimeout(() => {
        const el = document.getElementById("programs-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    // Individual program hash — expand that card
    const prog = programs.find(p => p.id === hash);
    if (!prog) return;
    setActiveCategory("All Programs");
    setExpandedCard(hash);
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }, [location.hash, location.search]);

  const filtered = activeCategory === "All Programs"
    ? programs
    : programs.filter(p => p.category === activeCategory);

  const abacusLevels = programs.filter(p => p.category === "Abacus");

  const categoryCounts = {
    "All Programs": programs.length,
    "Abacus": programs.filter(p => p.category === "Abacus").length,
    "Vedic Maths": programs.filter(p => p.category === "Vedic Maths").length,
    "Abacus Tutor Training": programs.filter(p => p.category === "Abacus Tutor Training").length,
    "Vedic Maths Tutor Training": programs.filter(p => p.category === "Vedic Maths Tutor Training").length,
    "Corresponding Courses": programs.filter(p => p.category === "Corresponding Courses").length,
  };

  return (
    <AppLayout>
      <Seo
        title="Courses — Abacus, Vedic Maths & Brain Development"
        description="Explore our structured programs: 8-level Abacus, Vedic Mathematics, Tutor Training, and Brain Development for children. Learn from master trainers at Rabbi Global Academy."
        path="/courses"
        jsonLd={courseListJsonLd([
          { name: "Abacus Program", description: "8-level Abacus mental arithmetic program building speed, concentration, and calculation skills." },
          { name: "Vedic Mathematics", description: "4-level Vedic Maths program teaching fast mental calculation techniques." },
          { name: "Tutor Training", description: "Professional training to become a certified Abacus and Vedic Maths instructor." },
          { name: "Brain Development", description: "Cognitive development program to boost memory, focus, and learning ability in children." },
        ])}
      />
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #142d50 0%, #0f2745 55%, #173861 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%)]" />
        <div className="absolute -left-20 top-8 w-72 h-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-16 fill-background">
            <path d="M0,80 C300,0 900,80 1200,0 L1200,80 Z" />
          </svg>
        </div>
        <div className="container px-4 pt-14 pb-24 relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 text-white text-sm font-medium mb-6">
                <span>Home</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-secondary">Courses Offered</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-secondary text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm">
                <Rocket className="h-3.5 w-3.5" /> Rabbi Global Academy
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
                Academic Programs<br />
                <span className="text-secondary">&amp; Courses</span>
              </h1>
              <p className="text-base sm:text-xl text-white leading-relaxed max-w-2xl">
                Every program offered at Rabbi Global Academy — from Prenatal Workshops and Pre-Primary Abacus to 8 graded levels of mastery, interactive learning tools, and skill enhancement courses.
              </p>
              <div className="flex flex-wrap gap-6 sm:gap-8 mt-8 sm:mt-10">
                {[
                  { value: "8", label: "Abacus Levels" },
                  { value: programs.length + "+", label: "Programs" },
                  { value: "ISO", label: "9001:2015 Certified" },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-serif font-bold text-secondary">{stat.value}</div>
                    <div className="text-white text-sm mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Hero illustration — transparent PNG floating on navy */}
             <div className="relative flex items-center justify-center min-h-[260px] lg:min-h-[460px]">
              {/* Soft radial glow behind the character */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(201,162,75,0.18) 0%, rgba(100,160,255,0.10) 50%, transparent 72%)" }} />

              {/* Animated orbital number rings */}
              <svg
                className="absolute pointer-events-none z-0"
                style={{ width: "520px", height: "520px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                viewBox="0 0 520 520"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="centralGlow" cx="50%" cy="56%" r="50%">
                    <stop offset="0%" stopColor="rgba(201,162,75,0.45)" />
                    <stop offset="45%" stopColor="rgba(96,165,250,0.18)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <filter id="fGold" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="fBlue" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="fPurple" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <path id="r1" d="M 260,260 m -225,0 a 225,78 0 1,1 450,0 a 225,78 0 1,1 -450,0" transform="rotate(-16, 260, 260)" />
                  <path id="r2" d="M 260,260 m -185,0 a 185,64 0 1,1 370,0 a 185,64 0 1,1 -370,0" transform="rotate(23, 260, 260)" />
                  <path id="r3" d="M 260,260 m -205,0 a 205,70 0 1,1 410,0 a 205,70 0 1,1 -410,0" transform="rotate(5, 260, 260)" />
                </defs>

                {/* Central pulsing radiance */}
                <ellipse cx="260" cy="285" rx="125" ry="95" fill="url(#centralGlow)">
                  <animate attributeName="rx" values="115;138;115" dur="3.2s" repeatCount="indefinite" />
                  <animate attributeName="ry" values="85;105;85" dur="3.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.55;1;0.55" dur="3.2s" repeatCount="indefinite" />
                </ellipse>

                {/* Ring 1 — gold glow layer */}
                <ellipse cx="260" cy="260" rx="225" ry="78" fill="none"
                  stroke="rgba(201,162,75,0.5)" strokeWidth="4"
                  transform="rotate(-16, 260, 260)" filter="url(#fGold)" />
                {/* Ring 1 — sharp line */}
                <ellipse cx="260" cy="260" rx="225" ry="78" fill="none"
                  stroke="rgba(255,210,90,0.7)" strokeWidth="1"
                  transform="rotate(-16, 260, 260)" />

                {/* Numbers on ring 1 */}
                {["1","3","5","7","9","2","4","8"].map((n, i) => (
                  <text key={i} fill="rgba(255,215,80,1)" fontSize="17" fontWeight="bold"
                    textAnchor="middle" dominantBaseline="middle" filter="url(#fGold)">
                    {n}
                    <animateMotion dur="13s" repeatCount="indefinite" rotate="none" begin={`-${(i / 8) * 13}s`}>
                      <mpath href="#r1" />
                    </animateMotion>
                  </text>
                ))}
                {/* Symbols on ring 1 */}
                {["+","−","×"].map((s, i) => (
                  <text key={i} fill="rgba(255,230,100,1)" fontSize="18" fontWeight="bold"
                    textAnchor="middle" dominantBaseline="middle" filter="url(#fGold)">
                    {s}
                    <animateMotion dur="13s" repeatCount="indefinite" rotate="none" begin={`-${(i / 3) * 13 + 1.5}s`}>
                      <mpath href="#r1" />
                    </animateMotion>
                  </text>
                ))}

                {/* Ring 2 — blue glow layer */}
                <ellipse cx="260" cy="260" rx="185" ry="64" fill="none"
                  stroke="rgba(96,165,250,0.45)" strokeWidth="4"
                  transform="rotate(23, 260, 260)" filter="url(#fBlue)" />
                {/* Ring 2 — sharp line */}
                <ellipse cx="260" cy="260" rx="185" ry="64" fill="none"
                  stroke="rgba(140,210,255,0.7)" strokeWidth="1"
                  transform="rotate(23, 260, 260)" />

                {/* Numbers on ring 2 */}
                {["6","4","8","1","3","5"].map((n, i) => (
                  <text key={i} fill="rgba(150,220,255,1)" fontSize="15" fontWeight="bold"
                    textAnchor="middle" dominantBaseline="middle" filter="url(#fBlue)">
                    {n}
                    <animateMotion dur="9s" repeatCount="indefinite" rotate="none" begin={`-${(i / 6) * 9}s`}>
                      <mpath href="#r2" />
                    </animateMotion>
                  </text>
                ))}
                {/* Symbols on ring 2 */}
                {["÷","+","−"].map((s, i) => (
                  <text key={i} fill="rgba(150,225,255,1)" fontSize="16" fontWeight="bold"
                    textAnchor="middle" dominantBaseline="middle" filter="url(#fBlue)">
                    {s}
                    <animateMotion dur="9s" repeatCount="indefinite" rotate="none" begin={`-${(i / 3) * 9 + 0.8}s`}>
                      <mpath href="#r2" />
                    </animateMotion>
                  </text>
                ))}

                {/* Ring 3 — purple accent, symbols */}
                <ellipse cx="260" cy="260" rx="205" ry="70" fill="none"
                  stroke="rgba(168,85,247,0.18)" strokeWidth="2.5"
                  transform="rotate(5, 260, 260)" filter="url(#fPurple)" />
                {["×","÷","+","−"].map((s, i) => (
                  <text key={i} fill="rgba(215,140,255,0.95)" fontSize="15" fontWeight="bold"
                    textAnchor="middle" dominantBaseline="middle" filter="url(#fPurple)">
                    {s}
                    <animateMotion dur="17s" repeatCount="indefinite" rotate="none" begin={`-${(i / 4) * 17}s`}>
                      <mpath href="#r3" />
                    </animateMotion>
                  </text>
                ))}
              </svg>

              {/* The character — transparent PNG floating on navy */}
              <picture>
                <source srcSet="/images/courses-hero-nobg.webp" type="image/webp" />
                <img
                  src="/images/courses-hero-nobg.png"
                  alt="Champion-level abacus student with trophy"
                  className="relative z-10 w-full max-w-[500px] h-[500px] object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                />
              </picture>

              {/* Floating badge — ISO / Achievers */}
              <div className="absolute bottom-10 left-2 z-20 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">ISO Certified</span>
                </div>
                <p className="text-sm font-semibold leading-snug">
                  Achievers<br />
                  <span className="text-xs font-normal text-white">Abacus Mastery — Champion Level</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Level Journey Roadmap ── */}
      <section
        id="journey"
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #fdf6ff 0%, #fffbf0 40%, #f0fbff 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #c4b5fd, transparent 70%)" }} />
        <div className="pointer-events-none absolute top-10 right-0 w-64 h-64 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #fde68a, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 left-1/2 w-96 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #6ee7b7, transparent 70%)" }} />

        <div className="container px-4 relative z-10">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-violet-200 rounded-full px-5 py-2 text-violet-600 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              Abacus Learning Journey
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4 leading-tight">
              From Tiny Tots to
              <span className="text-secondary"> Champions!</span>
            </h2>
            <p className="text-foreground text-base max-w-2xl mx-auto leading-relaxed">
              Eight joyful stages of growth — each illustrated as a cheerful cartoon learning adventure your child will love.
            </p>
          </div>

          {/* Journey cards grid — 4 per row on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {journeyCards.map((card, idx) => (
              <div
                key={card.key}
                className="group relative flex flex-col rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white border border-white"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Step badge */}
                <div className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-[11px] font-black text-primary">{idx}</span>
                </div>

                {/* Illustration area */}
                <div className={`relative ${card.bg} pt-6 px-4 pb-0 flex-shrink-0`}>
                  {/* Cartoon illustration — transparent PNG floating in pastel */}
                  <img
                    src={card.image}
                    alt={`${card.title} — Abacus level illustration`}
                    className="w-full h-52 object-contain object-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                    style={card.blendMode ? { mixBlendMode: card.blendMode } : undefined}
                    loading="lazy"
                  />
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 px-5 pt-4 pb-5 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${card.accent}`} />
                    <h3 className={`text-lg font-serif font-bold leading-tight ${card.accentText}`}>{card.title}</h3>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed flex-1">{card.description}</p>
                  {/* Bottom accent stripe */}
                  <div className={`mt-4 h-1 w-12 rounded-full ${card.accent} opacity-50`} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Program Cards ── */}
      <section
        className="relative py-16 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #fffdf8 0%, #f8f9ff 100%)" }}
      >
        {/* Soft blobs */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fde68a, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a5f3fc, transparent 70%)" }} />

        <div className="container px-4 relative z-10">
          {/* Section intro */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-amber-200 rounded-full px-5 py-2 text-amber-700 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
              <BookOpen className="h-3.5 w-3.5" />
              Our Programs
            </div>
            <h2 className="text-4xl font-serif font-bold text-primary mb-3">
              Every Child, Every Stage,
              <span className="text-secondary"> Every Goal</span>
            </h2>
            <p className="text-foreground max-w-2xl mx-auto leading-relaxed">
              {activeCategory === "All Programs"
                ? `${programs.length} programs spanning prenatal to mastery — find the perfect fit for your child.`
                : `Showing ${categoryCounts[activeCategory]} programs in the ${activeCategory} category.`}
            </p>
          </div>

          {/* ── Filter Tabs ── */}
          <div id="programs-section" className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { cat: "All Programs",               emoji: "🌟" },
              { cat: "Abacus",                     emoji: "🔢" },
              { cat: "Vedic Maths",                emoji: "🧮" },
              { cat: "Abacus Tutor Training",      emoji: "🎓" },
              { cat: "Vedic Maths Tutor Training", emoji: "🧠" },
              { cat: "Corresponding Courses",      emoji: "📚" },
            ].map(({ cat, emoji }) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-md scale-105"
                    : "text-foreground hover:text-primary hover:bg-muted/60 border border-border/40"
                }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                {cat}
                <span className={`ml-0.5 text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeCategory === cat ? "bg-white/25 text-white" : "bg-muted text-foreground"
                }`}>
                  {categoryCounts[cat]}
                </span>
              </button>
            ))}
          </div>

          {/* Category groups or flat grid */}
          {activeCategory === "All Programs" ? (
            <div className="space-y-16">
              {[
                { cat: "Abacus",                    emoji: "🔢", label: "Abacus Programs",                sub: "Beginners through Star — 8 graded levels to mastery",               pill: "bg-rose-100 text-rose-700 border-rose-200" },
                { cat: "Vedic Maths",               emoji: "🧮", label: "Vedic Maths",                    sub: "Starters Level 1 through Racers Level 4",                           pill: "bg-violet-100 text-violet-700 border-violet-200" },
                { cat: "Abacus Tutor Training",     emoji: "🎓", label: "Abacus Tutor Training",          sub: "Identify Bead Values & Flash Card practice modules",               pill: "bg-teal-100 text-teal-700 border-teal-200" },
                { cat: "Vedic Maths Tutor Training",emoji: "🧠", label: "Vedic Maths Tutor Training",     sub: "Speed Mathematics & Brain Training program",                       pill: "bg-indigo-100 text-indigo-700 border-indigo-200" },
                { cat: "Corresponding Courses",     emoji: "📚", label: "Corresponding Courses",          sub: "Prenatal workshops & product feature programs",                    pill: "bg-amber-100 text-amber-700 border-amber-200" },
              ].map(({ cat, emoji, label, sub, pill }) => {
                const catPrograms = programs.filter(p => p.category === cat);
                if (!catPrograms.length) return null;
                return (
                  <div key={cat}>
                    {/* Category divider banner */}
                    <div className="flex items-center gap-4 mb-7">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold shadow-sm ${pill}`}>
                        <span className="text-lg leading-none">{emoji}</span>
                        {label}
                      </div>
                      <span className="flex-1 h-px bg-border/60" />
                      <span className="text-xs text-foreground">{sub}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catPrograms.map(prog => (
                        <ProgramCard
                          key={prog.id}
                          prog={prog}
                          isExpanded={expandedCard === prog.id}
                          onToggle={() => setExpandedCard(expandedCard === prog.id ? null : prog.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(prog => (
                <ProgramCard
                  key={prog.id}
                  prog={prog}
                  isExpanded={expandedCard === prog.id}
                  onToggle={() => setExpandedCard(expandedCard === prog.id ? null : prog.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Four Core Skills ── */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #eef6ff 0%, #fdf4ff 45%, #fffbf0 100%)" }}
      >
        {/* Background blobs */}
        <div className="pointer-events-none absolute -right-10 top-0 w-96 h-96 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #c4b5fd, transparent 70%)" }} />
        <div className="pointer-events-none absolute -left-10 bottom-0 w-80 h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #6ee7b7, transparent 70%)" }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fde68a, transparent 70%)" }} />

        {/* Floating math symbols — decorative */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
          {[
            { sym: "+", top: "8%",  left: "6%",  size: "text-5xl", op: "opacity-[0.06]", anim: "animate-float-slow" },
            { sym: "×", top: "15%", left: "90%", size: "text-4xl", op: "opacity-[0.05]", anim: "animate-float" },
            { sym: "=", top: "75%", left: "4%",  size: "text-6xl", op: "opacity-[0.05]", anim: "animate-float-delayed" },
            { sym: "÷", top: "70%", left: "92%", size: "text-4xl", op: "opacity-[0.06]", anim: "animate-float-slow" },
            { sym: "∑", top: "40%", left: "2%",  size: "text-3xl", op: "opacity-[0.04]", anim: "animate-float" },
            { sym: "π", top: "30%", left: "96%", size: "text-3xl", op: "opacity-[0.04]", anim: "animate-float-delayed" },
            { sym: "9", top: "55%", left: "50%", size: "text-[120px]", op: "opacity-[0.03]", anim: "animate-float-slow" },
          ].map((item, i) => (
            <span key={i} className={`absolute font-black text-primary ${item.size} ${item.op} ${item.anim}`}
              style={{ top: item.top, left: item.left }}>
              {item.sym}
            </span>
          ))}
        </div>

        <div className="container px-4 max-w-6xl relative z-10">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white border border-purple-200 rounded-full px-5 py-2.5 text-purple-600 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
              <Sparkles className="h-3.5 w-3.5 text-secondary animate-shimmer" />
              Brain Skills Built for Life
              <Sparkles className="h-3.5 w-3.5 text-secondary animate-shimmer delay-300" />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4 leading-tight">
              Four Lifelong Skills,<br />
              <span className="text-secondary">Unlocked Through Abacus</span>
            </h2>
            <p className="text-foreground max-w-xl mx-auto leading-relaxed text-base">
              Every program at Rabbi Global Academy systematically builds these four core abilities in every student from day one.
            </p>
          </div>

          {/* Skill cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {[
              {
                icon: BrainCircuit, title: "Concentration",
                topBg: "bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100",
                glowBg: "from-sky-400/20 via-blue-300/10 to-transparent",
                ringColor: "shadow-blue-100",
                iconColor: "text-blue-700",
                iconBg: "bg-blue-50",
                border: "border-blue-100/80",
                number: "01",
                mathSymbol: "+",
                mathColor: "text-blue-300",
                desc: "Sustained attention span that helps students excel in classrooms and competitive exams.",
                img: "/images/journey/skill-concentration-new.webp",
                floatClass: "animate-float",
              },
              {
                icon: Eye, title: "Visualization",
                topBg: "bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100",
                glowBg: "from-amber-400/20 via-orange-300/10 to-transparent",
                ringColor: "shadow-amber-100",
                iconColor: "text-amber-700",
                iconBg: "bg-amber-50",
                border: "border-amber-100/80",
                number: "02",
                mathSymbol: "×",
                mathColor: "text-orange-300",
                desc: "Ability to picture and manipulate numbers as vivid mental images for faster, accurate recall.",
                img: "/images/journey/skill-visualization-new.webp",
                floatClass: "animate-float-delayed",
              },
              {
                icon: Ear, title: "Listening",
                topBg: "bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100",
                glowBg: "from-emerald-400/20 via-teal-300/10 to-transparent",
                ringColor: "shadow-emerald-100",
                iconColor: "text-emerald-700",
                iconBg: "bg-emerald-50",
                border: "border-emerald-100/80",
                number: "03",
                mathSymbol: "÷",
                mathColor: "text-teal-300",
                desc: "Sharp auditory processing that improves comprehension, instruction-following, and memory.",
                img: "/images/journey/skill-listening-new.webp",
                floatClass: "animate-float-slow",
              },
              {
                icon: Zap, title: "Speed & Accuracy",
                topBg: "bg-gradient-to-br from-violet-100 via-fuchsia-100 to-pink-100",
                glowBg: "from-violet-400/20 via-fuchsia-300/10 to-transparent",
                ringColor: "shadow-violet-100",
                iconColor: "text-violet-700",
                iconBg: "bg-violet-50",
                border: "border-violet-100/80",
                number: "04",
                mathSymbol: "=",
                mathColor: "text-fuchsia-300",
                desc: "Lightning-fast, error-free calculation skills that build academic confidence for life.",
                img: "/images/journey/skill-speed-new.webp",
                floatClass: "animate-float",
              },
            ].map(skill => (
              <div
                key={skill.title}
                className={`group relative rounded-[2.5rem] border ${skill.border} bg-white overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
              >
                {/* Ambient glow layer */}
                <div className={`absolute inset-0 bg-gradient-to-b ${skill.glowBg} pointer-events-none`} />
                {/* Soft halo behind illustration */}
                <div className="absolute inset-x-6 top-4 h-32 rounded-full blur-3xl bg-white/50 pointer-events-none" />

                {/* ── Illustrated top ── */}
                <div className={`${skill.topBg} relative overflow-hidden`}>
                  {/* Soft radial light from top-center */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.60),_transparent_65%)] pointer-events-none" />

                  {/* Floating math symbol — card-specific */}
                  <span className={`absolute right-5 top-5 font-black text-4xl ${skill.mathColor} opacity-30 pointer-events-none select-none ${skill.floatClass}`}>
                    {skill.mathSymbol}
                  </span>

                  {/* Cartoon illustration */}
                  <img
                    src={skill.img}
                    alt={skill.title}
                    className="relative z-10 w-full h-56 object-contain object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Bottom gradient fade into white card */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />

                  {/* Numbered skill badge */}
                  <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-md">
                    <div className={`w-6 h-6 rounded-lg ${skill.iconBg} flex items-center justify-center`}>
                      <skill.icon className={`h-3.5 w-3.5 ${skill.iconColor}`} />
                    </div>
                    <span className={`text-[11px] font-black ${skill.iconColor}`}>{skill.number}</span>
                  </div>

                  {/* Glowing orb dots */}
                  <div className="absolute right-4 bottom-4 z-20 flex items-end gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full bg-white/90 animate-glow-pulse ${skill.ringColor}`} style={{ boxShadow: "0 0 10px 4px rgba(255,255,255,0.7)" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60 delay-200" style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.5)" }} />
                    <span className="h-1 w-1 rounded-full bg-white/40 delay-500" style={{ boxShadow: "0 0 6px 2px rgba(255,255,255,0.4)" }} />
                  </div>
                </div>

                {/* ── Card body ── */}
                <div className="relative z-10 px-6 pt-5 pb-6">
                  <h3 className={`font-serif font-bold text-xl ${skill.iconColor} mb-2 leading-tight`}>{skill.title}</h3>
                  <p className="text-foreground text-sm leading-relaxed">{skill.desc}</p>

                  {/* Decorative bottom accent line */}
                  <div className={`mt-5 h-1 w-12 rounded-full bg-gradient-to-r ${skill.topBg} opacity-60`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full Comparison Table ── */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)" }}
      >
        <div className="pointer-events-none absolute top-0 left-1/2 w-96 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fde68a, transparent 70%)" }} />

        <div className="container px-4 max-w-5xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-sky-200 rounded-full px-5 py-2 text-sky-700 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
              <GraduationCap className="h-3.5 w-3.5" />
              All Programs at a Glance
            </div>
            <h2 className="text-4xl font-serif font-bold text-primary mb-3">Complete Program Overview</h2>
            <p className="text-foreground">All {programs.length} programs — category and duration at a glance.</p>
          </div>

          <div className="rounded-[2rem] border border-border/60 overflow-hidden shadow-lg bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, #142d50 0%, #173861 100%)" }} className="text-white">
                    <th className="text-left px-6 py-4 font-semibold">Program</th>
                    <th className="text-left px-6 py-4 font-semibold">Level</th>
                    <th className="text-left px-6 py-4 font-semibold">Duration</th>
                    <th className="text-left px-6 py-4 font-semibold">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((prog, i) => (
                    <tr key={prog.id} className={`border-b border-border/30 transition-colors hover:bg-secondary/5 ${i % 2 === 0 ? "bg-white" : "bg-muted/10"}`}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${prog.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <prog.icon className={`h-3.5 w-3.5 ${prog.iconColor}`} />
                          </div>
                          <span className="font-semibold text-primary">{prog.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${prog.badgeColor}`}>
                          {prog.badge}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 text-foreground">
                          <Clock className="h-3 w-3" />
                          {prog.duration}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-foreground text-xs">{prog.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #142d50 0%, #0f2745 55%, #173861 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute -left-16 top-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.10),_transparent_40%)]" />

        <div className="container px-4 relative z-10">
          <div className="grid lg:grid-cols-[1fr_0.55fr] gap-12 items-center max-w-5xl mx-auto">
            {/* Text side */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-secondary text-xs font-semibold uppercase tracking-widest backdrop-blur-sm mb-6">
                <PartyPopper className="h-3.5 w-3.5" />
                Start Your Child's Journey Today
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
                Ready to Begin<br />
                <span className="text-secondary">the Journey?</span>
              </h2>
              <p className="text-white text-lg mb-8 leading-relaxed max-w-xl">
                Our academic counselors are ready to guide your child into exactly the right program and level. Reach out today and take the first step.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-base">
                    Call Us Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Illustration side */}
            <div className="relative block">
              <div className="absolute inset-0 rounded-[2rem] bg-white/10 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur-xl p-4 shadow-2xl">
                <img
                  src="/images/journey/achievers-cta-new.webp"
                  alt="Champion learners celebrating"
                  className="w-full h-72 object-cover rounded-[1.5rem] border border-white/20"
                  loading="lazy"
                  decoding="async"
                />
                <div className="mt-3 flex items-center gap-3 px-1">
                  {journeyCards.slice(0, 4).map(c => (
                    <img key={c.key} src={c.image} alt={c.title}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white/30 shadow-md"
                      loading="lazy" decoding="async"
                    />
                  ))}
                  <div className="text-white text-xs font-medium ml-1">+{journeyCards.length - 4} more levels</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function DemoModal({ prog, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  const validatePhone = (val) => /^[6-9]\d{9}$/.test(val.replace(/\s/g, ""));

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) { setNameErr("Full name is required."); valid = false; } else { setNameErr(""); }
    if (!phone.trim()) { setPhoneErr("Contact number is required."); valid = false; }
    else if (!validatePhone(phone.trim())) { setPhoneErr("Enter a valid 10-digit Indian mobile number."); valid = false; }
    else { setPhoneErr(""); }
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          program: prog.title,
          programId: prog.id,
        }),
      });
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok) throw new Error(data.error || "Submission failed. Please try again.");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-serif font-bold text-primary mb-2">Request Received!</h3>
            <p className="text-foreground/70 text-sm mb-6">We'll contact you shortly to schedule your free demo for <span className="font-semibold text-primary">{prog.title}</span>.</p>
            <button onClick={onClose} className="bg-primary text-white rounded-xl px-6 py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors">Done</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-bold mb-4 bg-gradient-to-r ${prog.accentColor}`}>
              <prog.icon className="h-3.5 w-3.5" />
              {prog.title}
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary mb-1">Request a Free Demo</h3>
            <p className="text-foreground/60 text-sm mb-6">Fill in your details and our team will reach out to schedule your session.</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (nameErr) setNameErr(""); }}
                  placeholder="Enter your full name"
                  className={`w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${nameErr ? "border-red-400 bg-red-50/40" : "border-border"}`}
                />
                {nameErr && <p className="text-red-500 text-xs mt-1">{nameErr}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); if (phoneErr) setPhoneErr(""); }}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className={`w-full h-11 px-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${phoneErr ? "border-red-400 bg-red-50/40" : "border-border"}`}
                />
                {phoneErr && <p className="text-red-500 text-xs mt-1">{phoneErr}</p>}
              </div>
              {error && (
                <p className="text-red-500 text-xs text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-11 rounded-xl text-white font-semibold text-sm bg-gradient-to-r ${prog.accentColor} hover:opacity-90 transition-opacity shadow-md mt-2 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading ? "Sending…" : "Submit Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ProgramCard({ prog, isExpanded, onToggle }) {
  const [showDemo, setShowDemo] = useState(false);
  const { openEnrollModal } = useEnrollModal();
  return (
    <>
    <div id={prog.id} className={`group relative flex flex-col rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border border-border/50 ${isExpanded ? "ring-2 ring-primary/20 shadow-xl" : ""}`}>

      {/* Illustrated top banner */}
      <div className={`relative bg-gradient-to-br ${prog.accentColor} pt-6 pb-0 px-6 overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-8 w-14 h-14 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-start justify-between mb-4">
          {/* Big icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center shadow-md">
            <prog.icon className="h-7 w-7 text-white" />
          </div>
          {/* Badge */}
          <span className="bg-white/20 text-white border border-white/30 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm leading-tight text-center max-w-[130px]">
            {prog.badge}
          </span>
        </div>

        <div className="relative z-10 pb-5">
          <h3 className="text-xl font-serif font-bold text-white mb-0.5">{prog.title}</h3>
          <p className="text-white text-xs font-semibold uppercase tracking-wider">{prog.subtitle}</p>
        </div>

        {/* Wave bottom edge */}
        <div className="absolute -bottom-px left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="w-full h-5 fill-white">
            <path d="M0,20 C100,0 300,20 400,0 L400,20 Z" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground mb-4 pb-4 border-b border-border/50">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {prog.duration}</span>
          <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {prog.sessions}</span>
        </div>

        <p className="text-foreground text-sm leading-relaxed mb-4">{prog.description}</p>

        {/* Skill tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {prog.skills.map(s => (
            <span key={s} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${prog.iconBg} ${prog.iconColor} border ${prog.badgeColor}`}>
              {s}
            </span>
          ))}
        </div>

        {/* Expanded highlights */}
        {isExpanded && (
          <div className="mb-4 pt-4 border-t border-border/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-secondary" /> What You'll Learn
            </h4>
            <ul className="space-y-2">
              {prog.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <div className={`h-1.5 w-1.5 rounded-full mt-2 shrink-0 bg-gradient-to-br ${prog.accentColor}`} />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <button
              onClick={onToggle}
              className={`flex-1 text-sm font-semibold py-2.5 px-4 rounded-xl border transition-all ${
                isExpanded
                  ? "bg-primary text-white border-primary"
                  : "border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
              }`}
            >
              {isExpanded ? "Show Less" : "View Details"}
            </button>
            <Button
              onClick={() => openEnrollModal(prog.title)}
              className={`flex-shrink-0 bg-gradient-to-r ${prog.accentColor} text-white border-none hover:opacity-90 rounded-xl py-2.5 px-4 text-sm font-semibold shadow-md`}
            >
              Enroll
            </Button>
          </div>
          <button
            onClick={() => setShowDemo(true)}
            className="w-full text-sm font-semibold py-2.5 px-4 rounded-xl border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all"
          >
            Request Demo
          </button>
        </div>
      </div>
    </div>

    {showDemo && <DemoModal prog={prog} onClose={() => setShowDemo(false)} />}
    </>
  );
}
