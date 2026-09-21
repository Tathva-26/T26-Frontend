"use client";

import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useRouter } from "next/navigation";

// Mock Workshops Data
const WORKSHOPS_DATA = [
  {
    id: "ws-1",
    title: "Workshop",
    fullTitle: "Deep Space Robotics & Autonomous Navigation",
    category: "Aerospace",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "09",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Dr. Mark Thorne (Ames Research)",
    duration: "6 Hours (2 Days)",
    time: "10:00 AM - 1:00 PM IST",
    venue: "Lab 4, Tech Block & Online",
    activityPoints: "40 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 14,
    description:
      "Explore the frontier of autonomous rover guidance, spatial sensor fusion, and zero-gravity control systems. Build and test a simulated lunar rover trajectory from scratch.",
    prerequisites:
      "Basic Python knowledge & enthusiastic curiosity in aerospace systems.",
  },
  {
    id: "ws-2",
    title: "Workshop",
    fullTitle: "Next-Gen Humanoid & Cybernetic Systems",
    category: "Robotics",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "09",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Elena Rostova (CyberTech Labs)",
    duration: "5 Hours",
    time: "02:00 PM - 07:00 PM IST",
    venue: "Robotics Arena & Mechatronics Lab",
    activityPoints: "35 KTU Activity Points",
    fee: "₹549",
    spotsLeft: 8,
    description:
      "Hands-on workshop covering ROS2, kinematic simulation, and computer vision integration for bipedal robotic manipulation and real-time posture adjustments.",
    prerequisites: "Fundamentals of C++ or Python, basic mechanics.",
  },
  {
    id: "ws-3",
    title: "Workshop",
    fullTitle: "Quantum Algorithms & Quantum Machine Learning",
    category: "AI & ML",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "09",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Vikram Sen (Q-Core Institute)",
    duration: "4 Hours",
    time: "11:00 AM - 03:00 PM IST",
    venue: "Seminar Complex & Hybrid",
    activityPoints: "30 KTU Activity Points",
    fee: "₹449",
    spotsLeft: 22,
    description:
      "Demystify quantum superposition and entanglement. Write quantum circuits on Qiskit and run hybrid quantum-classical neural networks on real quantum emulators.",
    prerequisites: "Linear algebra basics and basic Python.",
  },
  {
    id: "ws-4",
    title: "Workshop",
    fullTitle: "Orbital Mechanics & Satellite Telemetry",
    category: "Aerospace",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "09",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Dr. Sarah Lin (Orbital Sciences)",
    duration: "6 Hours",
    time: "09:30 AM - 03:30 PM IST",
    venue: "Avionics Hall",
    activityPoints: "40 KTU Activity Points",
    fee: "₹599",
    spotsLeft: 5,
    description:
      "Deep dive into CubeSat hardware architectures, telemetry ground stations, Doppler tracking, and orbital path calculations using real satellite downlink packets.",
    prerequisites: "Introductory physics and signal concepts.",
  },
  {
    id: "ws-5",
    title: "Workshop",
    fullTitle: "Generative AI Agents & Multi-Modal LLMs",
    category: "AI & ML",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "09",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Arjun Nambiar (AI Research Group)",
    duration: "5 Hours",
    time: "01:00 PM - 06:00 PM IST",
    venue: "Computing Hall Alpha",
    activityPoints: "35 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 19,
    description:
      "Construct autonomous agent swarms, vector retrieval pipelines (RAG), and multimodal reasoning tools that connect directly to APIs and real-world workflows.",
    prerequisites: "Python programming.",
  },
  {
    id: "ws-6",
    title: "Workshop",
    fullTitle: "Zero-Trust Cybersecurity & Threat Simulation",
    category: "Cybersecurity",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "09",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Kavya Menon (DefSec Global)",
    duration: "6 Hours",
    time: "10:00 AM - 04:00 PM IST",
    venue: "Cyber Defense Lab",
    activityPoints: "40 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 12,
    description:
      "Simulate red-team attacks and blue-team mitigation in an enterprise sandboxed cyber range. Learn real-time incident forensics and hardware cryptographic tokens.",
    prerequisites: "Basic networking & Linux command line.",
  },
  {
    id: "ws-7",
    title: "Workshop",
    fullTitle: "Advanced Drone Engineering & Swarm Intelligence",
    category: "Aerospace",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "10",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Capt. Neil Iyer (AeroDynamics Lab)",
    duration: "6 Hours (2 Days)",
    time: "09:00 AM - 12:00 PM IST",
    venue: "Open Arena & Drone Bay",
    activityPoints: "40 KTU Activity Points",
    fee: "₹599",
    spotsLeft: 7,
    description:
      "Design autonomous drone flight paths, implement swarm coordination algorithms, and test multi-UAV formations using PX4 and ROS-based simulation environments.",
    prerequisites: "Basic Python and introductory robotics concepts.",
  },
  {
    id: "ws-8",
    title: "Workshop",
    fullTitle: "Rocket Propulsion & Hypersonic Aerodynamics",
    category: "Aerospace",
    badge: "ISRO",
    dateMonth: "OCT",
    dateDay: "10",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Dr. K. S. Namboodiri (VSSC / ISRO)",
    duration: "6 Hours",
    time: "10:00 AM - 04:00 PM IST",
    venue: "Aerospace Simulation Lab",
    activityPoints: "40 KTU Activity Points",
    fee: "₹549",
    spotsLeft: 10,
    description:
      "Study cryogenic engine mechanics, solid propellant grain designs, and compressible aerodynamic shockwaves using computational fluid dynamics (CFD).",
    prerequisites: "Thermodynamics and basic fluid mechanics.",
  },
  {
    id: "ws-9",
    title: "Workshop",
    fullTitle: "Spacecraft Avionics & Interplanetary Comms",
    category: "Aerospace",
    badge: "ESA",
    dateMonth: "OCT",
    dateDay: "11",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Jean-Luc Dubois (Space Systems Europe)",
    duration: "5 Hours",
    time: "01:00 PM - 06:00 PM IST",
    venue: "Avionics Hall Alpha",
    activityPoints: "35 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 15,
    description:
      "Understand radiation-hardened flight computers, deep-space network protocols, telemetry compression, and fault-tolerant attitude control.",
    prerequisites: "Basic digital electronics and signal processing.",
  },
  {
    id: "ws-10",
    title: "Workshop",
    fullTitle: "ROS2 & Autonomous Mobile Robot Navigation",
    category: "Robotics",
    badge: "IEEE",
    dateMonth: "OCT",
    dateDay: "10",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Dr. Ananya Rao (Vision AI Institute)",
    duration: "6 Hours",
    time: "09:30 AM - 03:30 PM IST",
    venue: "Robotics Arena & Mechatronics Lab",
    activityPoints: "40 KTU Activity Points",
    fee: "₹549",
    spotsLeft: 9,
    description:
      "Build map-based navigation pipelines with Nav2, SLAM algorithms, LiDAR integration, and real-time obstacle avoidance on differential-drive rovers.",
    prerequisites: "Python or C++ with Linux familiarity.",
  },
  {
    id: "ws-11",
    title: "Workshop",
    fullTitle: "Bipedal Locomotion & Dynamic Balance Control",
    category: "Robotics",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "11",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Prof. Kenneth Meyer (Dynamic Robotics)",
    duration: "5 Hours",
    time: "10:00 AM - 03:00 PM IST",
    venue: "Mechatronics Research Center",
    activityPoints: "35 KTU Activity Points",
    fee: "₹599",
    spotsLeft: 6,
    description:
      "Learn inverted pendulum models, Zero Moment Point (ZMP) calculations, and reinforcement learning-driven gait stabilization for biped humanoid robots.",
    prerequisites: "Classical mechanics and linear algebra.",
  },
  {
    id: "ws-12",
    title: "Workshop",
    fullTitle: "Underwater Robotics & Oceanic ROV Systems",
    category: "Robotics",
    badge: "IEEE",
    dateMonth: "OCT",
    dateDay: "11",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Tarun Chawla (OceanTech Innovations)",
    duration: "5 Hours",
    time: "02:00 PM - 07:00 PM IST",
    venue: "Hydrodynamics & Marine Lab",
    activityPoints: "35 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 16,
    description:
      "Explore waterproof thruster systems, acoustic positioning, ballast control, and tethered underwater video transmission for marine exploration ROVs.",
    prerequisites: "Introductory electronics and mechanics.",
  },
  {
    id: "ws-13",
    title: "Workshop",
    fullTitle: "Micro-Robotics & Surgical Robotic Manipulators",
    category: "Robotics",
    badge: "ASME",
    dateMonth: "OCT",
    dateDay: "12",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Dr. Maya Swaminathan (BioRobotics Lab)",
    duration: "4 Hours",
    time: "11:00 AM - 03:00 PM IST",
    venue: "Advanced Robotics Center",
    activityPoints: "30 KTU Activity Points",
    fee: "₹449",
    spotsLeft: 18,
    description:
      "Understand multi-degree-of-freedom surgical end-effectors, haptic force feedback teleoperation, and sub-millimeter precision servo actuation.",
    prerequisites: "Basics of microcontrollers and kinematic linkages.",
  },
  {
    id: "ws-14",
    title: "Workshop",
    fullTitle: "Computer Vision & Edge AI Object Detection",
    category: "AI & ML",
    badge: "IEEE",
    dateMonth: "OCT",
    dateDay: "10",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Arjun Nambiar (AI Research Group)",
    duration: "5 Hours",
    time: "11:00 AM - 04:00 PM IST",
    venue: "AI Research Wing",
    activityPoints: "35 KTU Activity Points",
    fee: "₹449",
    spotsLeft: 20,
    description:
      "Train YOLOv8 models, implement real-time video detection pipelines, and deploy edge-optimised vision models on Jetson Nano and mobile devices.",
    prerequisites: "Python and basic machine learning knowledge.",
  },
  {
    id: "ws-15",
    title: "Workshop",
    fullTitle: "Reinforcement Learning for Autonomous Driving",
    category: "AI & ML",
    badge: "NASA",
    dateMonth: "OCT",
    dateDay: "11",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Dr. David Sterling (AutoAI Labs)",
    duration: "6 Hours",
    time: "10:00 AM - 04:00 PM IST",
    venue: "Computing Hall Alpha",
    activityPoints: "40 KTU Activity Points",
    fee: "₹549",
    spotsLeft: 11,
    description:
      "Train deep Q-networks (DQN) and PPO agents in simulated CARLA environments to handle lane keeping, high-speed merging, and obstacle avoidance.",
    prerequisites: "Python, PyTorch or TensorFlow, and calculus.",
  },
  {
    id: "ws-16",
    title: "Workshop",
    fullTitle: "Diffusion Models & Neural Rendering (NeRFs)",
    category: "AI & ML",
    badge: "ACM",
    dateMonth: "OCT",
    dateDay: "12",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Siddharth Verma (Visual AI Labs)",
    duration: "5 Hours",
    time: "01:00 PM - 06:00 PM IST",
    venue: "Seminar Complex & Hybrid",
    activityPoints: "35 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 14,
    description:
      "Understand denoising diffusion probabilistic models (DDPM), latent diffusion, and neural radiance fields to synthesize 3D volumetric scenes from 2D images.",
    prerequisites: "Deep learning fundamentals and linear algebra.",
  },
  {
    id: "ws-17",
    title: "Workshop",
    fullTitle: "Ethical Hacking & Advanced Penetration Testing",
    category: "Cybersecurity",
    badge: "CEH",
    dateMonth: "OCT",
    dateDay: "10",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Aditya Kulkarni (HackSecure Labs)",
    duration: "6 Hours (2 Days)",
    time: "09:30 AM - 12:30 PM IST",
    venue: "Cyber Defense Lab",
    activityPoints: "40 KTU Activity Points",
    fee: "₹549",
    spotsLeft: 10,
    description:
      "Perform structured penetration tests on vulnerable web apps and networks. Master tools like Burp Suite, Nmap, and Metasploit in a controlled ethical hacking sandbox.",
    prerequisites: "Networking basics, Linux CLI, and HTTP fundamentals.",
  },
  {
    id: "ws-18",
    title: "Workshop",
    fullTitle: "Cloud Security Architecture & DevSecOps",
    category: "Cybersecurity",
    badge: "CNCF",
    dateMonth: "OCT",
    dateDay: "11",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Karthik Mohan (CloudScale Solutions)",
    duration: "5 Hours",
    time: "10:00 AM - 03:00 PM IST",
    venue: "Innovation Hub & Online",
    activityPoints: "35 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 17,
    description:
      "Implement infrastructure-as-code security scanning, container image vulnerability detection, automated IAM auditing, and runtime security monitoring.",
    prerequisites: "Basic Docker and cloud concepts.",
  },
  {
    id: "ws-19",
    title: "Workshop",
    fullTitle: "Hardware Security, Side-Channel & Firmware Hacking",
    category: "Cybersecurity",
    badge: "DEFCON",
    dateMonth: "OCT",
    dateDay: "12",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Naveen Raj (HardSec Research)",
    duration: "5 Hours",
    time: "09:00 AM - 02:00 PM IST",
    venue: "Hardware Security Suite",
    activityPoints: "35 KTU Activity Points",
    fee: "₹549",
    spotsLeft: 8,
    description:
      "Extract firmware from flash chips, analyze UART/JTAG debug ports, and perform power-analysis differential side-channel attacks on cryptographic chips.",
    prerequisites: "Basic electronics and C/assembly understanding.",
  },
  {
    id: "ws-20",
    title: "Workshop",
    fullTitle: "Cryptography & Quantum-Resistant Security",
    category: "Cybersecurity",
    badge: "IEEE",
    dateMonth: "OCT",
    dateDay: "12",
    image: "/images/workshop-astronaut.jpg",
    instructor: "Dr. Radhika Iyer (CryptoResearch Group)",
    duration: "5 Hours",
    time: "02:00 PM - 07:00 PM IST",
    venue: "Computing Hall Beta",
    activityPoints: "35 KTU Activity Points",
    fee: "₹499",
    spotsLeft: 13,
    description:
      "Explore lattice-based cryptography, post-quantum key exchange algorithms (Kyber, Dilithium), and modern zero-knowledge proof systems (zk-SNARKs).",
    prerequisites: "Discrete mathematics and basic cryptography.",
  },
];



// Tunable hover-response constants — focal card (Step 3 movement unchanged)
const MAX_TRANSLATE = 15;
const MAX_TILT = 3;
const HOVER_SCALE = 1.07;
const LIFT_Z = 18;
const REST_SHADOW = "0 4px 16px -3px rgba(0,0,0,0.45)";
const HOVER_SHADOW = "0 20px 34px -9px rgba(0,0,0,0.58)";
const ENTER_DURATION = 0.95;
const MOVE_DURATION = 1.92;
const LEAVE_DURATION = 0.6;
const EASE = "power2.out";

// Focal-card material/depth response (Step 5)
const REST_EDGE_BG = "rgba(18, 18, 24, 0.95)";
const FOCUS_EDGE_BG = "rgba(9, 9, 13, 0.98)";
const REST_EDGE_HIGHLIGHT_TOP = "rgba(255,255,255,0.08)";
const FOCUS_EDGE_HIGHLIGHT_TOP = "rgba(255,255,255,0.18)";
const REST_EDGE_HIGHLIGHT_LEFT = "rgba(255,255,255,0.05)";
const FOCUS_EDGE_HIGHLIGHT_LEFT = "rgba(255,255,255,0.11)";

// Surrounding-card "make room" response — Step 4
const GRID_GAP_PX = 32;
const MAX_SURROUND_DISPLACEMENT = 100;
const FALLOFF_STRENGTH = 0.4;
const NEAR_LAG = 0.001;
const FAR_LAG = 0.015;
const RAMP_IN_MS = 20;
const FIELD_RETURN_DURATION = 1.75;

// Step 6 — annotation/callout (replaces the old rectangular info panel)
// Geometry
const CALLOUT_LABEL_WIDTH = 280; // text-wrap width, not a visual box
const CALLOUT_LABEL_HEIGHT_ESTIMATE = 220;
const CALLOUT_GAP = 34; // distance from card edge to label's near edge
const CALLOUT_STUB = 16; // short initial leader segment away from the card
const CALLOUT_VIEWPORT_MARGIN = 20;
const CALLOUT_LABEL_ANCHOR_OFFSET_Y = 12; // aligns the line's end with the title line
const CALLOUT_LABEL_LAG = 0.06; // smoothing factor while following a moving card
// Motion
const CALLOUT_CONTAINER_FADE_IN = 0.18;
const CALLOUT_EXIT_DURATION = 0.4;
const LINE_DRAW_DURATION = 0.45; // within the 350–550ms target
const LINE_DRAW_EASE = "power2.out"; // engineered/precise, no overshoot
// Decode sequencing (connector starts drawing at t=0)
const TITLE_START = 0.2;
const TITLE_DECODE_DURATION = 0.4;
const META_START = 0.4;
const META_DECODE_DURATION = 0.4;
const DESC_START = 0.55;
const DESC_DECODE_DURATION = 0.55;
const PRICE_START = 0.85;
const PRICE_DECODE_DURATION = 0.3;
// Decode character set for the "untangling" effect
const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-+=<>/\\|[]{}";

// Step 7 — subtle center-composition resting stagger
const MAX_STAGGER = 18;
const STAGGER_ROW_TOLERANCE = 4;
const STAGGER_MIN_ROW_SIZE = 3;

// Step 8 — subtle focus field / surrounding quieting
const QUIET_OPACITY = 0.9;
const QUIET_BRIGHTNESS = 0.94;
const FOCAL_OPACITY = 1;
const FOCAL_BRIGHTNESS = 1;
const FOCUS_FIELD_DURATION = 0.6;
const FOCUS_FIELD_LEAVE_DURATION = 0.75;

// Step 9 — digital activation / pixelated entry response
const ACTIVATION_DURATION = 0.7;
const ACTIVATION_FADE_DURATION = 0.1;
const ACTIVATION_EASE = "power2.in";
const ACTIVATION_RING_SPREAD = 145;
const ACTIVATION_RING_BAND = 20;
const ACTIVATION_GRID_BAND = 21;
const ACTIVATION_GLOW_ALPHA = 0.14;
const ACTIVATION_GRID_ALPHA = 0.6;
const ACTIVATION_GRID_CELL = 10;

// Step 10 — continuous digital pulse
const PULSE_CYCLE_MIN = 1.7;
const PULSE_CYCLE_MAX = 2.3;
const PULSE_RISE_FRACTION = 0.3;
const PULSE_MAX_RADIUS = 150;
const PULSE_PEAK_ALPHA = 0.2;
const PULSE_FOLLOW_DURATION = 0.25;
const PULSE_LEAVE_FADE = 0.5;

// Step 11 — global dark focus overlay (page-wide dim pulse that originates
// from the hovered card). See the "── Step 11: global dark focus overlay ──"
// block below for how it integrates with the existing hover lifecycle.
const FOCUS_OVERLAY_Z = 15; // between resting card z-index (1) and focused card z-index (20)
const FOCUS_OVERLAY_COLOR = "rgba(4, 5, 9, 0.56)";
const FOCUS_PULSE_DURATION = 1.7; // slow, cinematic expansion from the hovered card
const FOCUS_PULSE_EASE = "power2.out";
const FOCUS_CLEAR_DURATION = 1.6; // clearing pulse that reverses the dark state
const FOCUS_CLEAR_EASE = "power2.out";
const FOCUS_RECENTER_DURATION = 0.55; // gliding focus directly between cards while already dark
const FOCUS_MASK_EDGE = 2; // px soft edge between the hole/dark/reveal bands of the mask

// Idle suspended floating / wobble motion
const IDLE_FLOAT_Y_MIN = 1.2;
const IDLE_FLOAT_Y_MAX = 1.8;
const IDLE_FLOAT_X_MIN = 0.8;
const IDLE_FLOAT_X_MAX = 1.4;
const IDLE_FLOAT_ROT_MIN = 0.35;
const IDLE_FLOAT_ROT_MAX = 0.55;
const IDLE_FLOAT_TILT_MIN = 0.20;
const IDLE_FLOAT_TILT_MAX = 0.40;
const IDLE_YIELD_DURATION = 0.5;
const IDLE_RESTORE_DURATION = 0.85;

export default function WorkshopsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewDetailsMode, setViewDetailsMode] = useState(false);

  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Step 6 — annotation callout render state
  const [calloutWorkshop, setCalloutWorkshop] = useState(null);
  const [calloutSide, setCalloutSide] = useState("right");

  // Click Zoom Transition state & locks
  const [activeTransition, setActiveTransition] = useState(null);
  const isNavigatingRef = useRef(false);
  const pageRef = useRef(null);
  const transitionOverlayRef = useRef(null);
  const transitionImgRef = useRef(null);
  const transitionTlRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const slotRefs = useRef({});
  const floatRefs = useRef({});
  const cardRefs = useRef({});
  const frontFaceRefs = useRef({});
  const isFinePointer = useRef(true);
  const prefersReducedMotion = useRef(false);
  const focusedIdRef = useRef(null);

  // Idle floating bookkeeping
  const idleWeightsRef = useRef({});
  const idleParamsRef = useRef({});
  const idleTickRef = useRef(null);

  const fieldActiveRef = useRef(false);
  const rampStartRef = useRef(0);
  const rectCacheRef = useRef({});
  const tickerRunningRef = useRef(false);
  const tickRef = useRef(null);

  // Page-load entrance animation
  const entranceCompleteRef = useRef(false);
  const entranceTlRef = useRef(null);

  // Step 6 — annotation callout refs
  const calloutOverlayRef = useRef(null);
  const calloutPathRef = useRef(null);
  const calloutLabelRef = useRef(null);
  const calloutTitleRef = useRef(null);
  const calloutMetaRef = useRef(null);
  const calloutDescRef = useRef(null);
  const calloutPriceRef = useRef(null);
  const calloutSideRef = useRef("right");
  const calloutVisibleRef = useRef(false);
  const calloutAnimatingRef = useRef(false);
  const calloutTimelineRef = useRef(null);
  const calloutDecodeRef = useRef({});

  // Step 9 bookkeeping
  const activationOverlayRefs = useRef({});
  const activationTimelineRefs = useRef({});

  // Step 10 bookkeeping
  const pulseOverlayRefs = useRef({});
  const pulseTimelineRefs = useRef({});
  const pulseFollowRefs = useRef({});

  // Step 11 — global dark focus overlay bookkeeping
  const focusOverlayRef = useRef(null);
  const focusTweenRef = useRef(null);
  const focusEngagedRef = useRef(false);
  const focusOriginRef = useRef({ x: 0, y: 0 });
  const focusMaxRadiusRef = useRef(0);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    isFinePointer.current = hoverQuery.matches;
    prefersReducedMotion.current = motionQuery.matches;

    const handleHoverChange = (e) => {
      isFinePointer.current = e.matches;
    };
    const handleMotionChange = (e) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches) {
        Object.values(floatRefs.current).forEach((el) => {
          if (el) gsap.set(el, { x: 0, y: 0, rotationZ: 0, rotationX: 0 });
        });
      }
    };

    hoverQuery.addEventListener("change", handleHoverChange);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      hoverQuery.removeEventListener("change", handleHoverChange);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Idle floating params
  const getIdleParams = (id) => {
    let hash = 0;
    const str = String(id ?? "");
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    const s1 = (hash % 1000) / 1000;
    const s2 = (Math.floor(hash / 1000) % 1000) / 1000;
    const s3 = (Math.floor(hash / 1000000) % 1000) / 1000;
    const s4 = ((hash ^ 0x5a5a5a5a) % 1000) / 1000;

    return {
      freqY: (2 * Math.PI) / (4.2 + s1 * 1.8),
      freqX: (2 * Math.PI) / (4.8 + s2 * 1.6),
      freqRot: (2 * Math.PI) / (4.0 + s3 * 2.0),
      freqTilt: (2 * Math.PI) / (3.6 + s4 * 1.6),
      phaseY: s1 * Math.PI * 2,
      phaseX: s2 * Math.PI * 2,
      phaseRot: s3 * Math.PI * 2,
      phaseTilt: s4 * Math.PI * 2,
      ampY: IDLE_FLOAT_Y_MIN + s1 * (IDLE_FLOAT_Y_MAX - IDLE_FLOAT_Y_MIN),
      ampX: IDLE_FLOAT_X_MIN + s2 * (IDLE_FLOAT_X_MAX - IDLE_FLOAT_X_MIN),
      ampRot: IDLE_FLOAT_ROT_MIN + s3 * (IDLE_FLOAT_ROT_MAX - IDLE_FLOAT_ROT_MIN),
      ampTilt: IDLE_FLOAT_TILT_MIN + s4 * (IDLE_FLOAT_TILT_MAX - IDLE_FLOAT_TILT_MIN),
    };
  };

  // Continuous idle floating loop
  useEffect(() => {
    const idleTick = () => {
      if (!isFinePointer.current || prefersReducedMotion.current) return;

      const t = performance.now() * 0.001;
      const floatMap = floatRefs.current;
      const weightsMap = idleWeightsRef.current;
      const paramsMap = idleParamsRef.current;

      for (const id in floatMap) {
        const el = floatMap[id];
        if (!el) continue;

        const wObj = weightsMap[id];
        const weight = wObj !== undefined ? wObj.weight : 1;

        if (weight <= 0.001) {
          if (el._hasIdleTransform) {
            gsap.set(el, { x: 0, y: 0, rotationZ: 0, rotationX: 0 });
            el._hasIdleTransform = false;
          }
          continue;
        }

        let p = paramsMap[id];
        if (!p) {
          p = getIdleParams(id);
          paramsMap[id] = p;
        }

        const y = Math.sin(t * p.freqY + p.phaseY) * p.ampY * weight;
        const x = Math.sin(t * p.freqX + p.phaseX) * p.ampX * weight;
        const rotZ = Math.sin(t * p.freqRot + p.phaseRot) * p.ampRot * weight;
        const rotX = Math.cos(t * p.freqTilt + p.phaseTilt) * p.ampTilt * weight;

        gsap.set(el, {
          x,
          y,
          rotationZ: rotZ,
          rotationX: rotX,
        });
        el._hasIdleTransform = true;
      }
    };

    idleTickRef.current = idleTick;
    gsap.ticker.add(idleTick);

    return () => {
      gsap.ticker.remove(idleTick);
    };
  }, []);

  const getPointerResponse = (e, slotEl) => {
    const rect = slotEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const nx = Math.min(Math.max(px - 0.5, -0.5), 0.5);
    const ny = Math.min(Math.max(py - 0.5, -0.5), 0.5);

    return {
      x: nx * 2 * MAX_TRANSLATE,
      y: ny * 2 * MAX_TRANSLATE,
      rotationY: nx * 2 * MAX_TILT,
      rotationX: -ny * 2 * MAX_TILT,
    };
  };

  const measureSlots = () => {
    const cache = {};
    Object.keys(slotRefs.current).forEach((id) => {
      const el = slotRefs.current[id];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      cache[id] = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    });
    rectCacheRef.current = cache;
  };

  const applyRestingStagger = () => {
    if (!isFinePointer.current) {
      Object.values(slotRefs.current).forEach((slotEl) => {
        if (slotEl) slotEl.style.transform = "";
      });
      return;
    }

    const cache = rectCacheRef.current;
    const ids = Object.keys(cache);
    if (ids.length === 0) return;

    const rows = {};
    ids.forEach((id) => {
      const top = cache[id].top;
      const rowKey = Math.round(top / STAGGER_ROW_TOLERANCE) * STAGGER_ROW_TOLERANCE;
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(id);
    });

    Object.values(rows).forEach((rowIds) => {
      if (rowIds.length < STAGGER_MIN_ROW_SIZE) {
        rowIds.forEach((id) => {
          const slotEl = slotRefs.current[id];
          if (slotEl) slotEl.style.transform = "";
        });
        return;
      }

      const xs = rowIds.map((id) => cache[id].cx);
      const rowMinX = Math.min(...xs);
      const rowMaxX = Math.max(...xs);
      const rowCenterX = (rowMinX + rowMaxX) / 2;
      const halfWidth = (rowMaxX - rowMinX) / 2 || 1;

      rowIds.forEach((id) => {
        const slotEl = slotRefs.current[id];
        if (!slotEl) return;
        const normalizedDist = Math.min(Math.abs(cache[id].cx - rowCenterX) / halfWidth, 1);
        const factor = Math.cos((normalizedDist * Math.PI) / 2);
        const stagger = -MAX_STAGGER * factor;
        slotEl.style.transform = stagger !== 0 ? `translateY(${stagger}px)` : "";
      });
    });
  };

  const remeasureAndStagger = () => {
    Object.values(slotRefs.current).forEach((slotEl) => {
      if (slotEl) slotEl.style.transform = "";
    });
    measureSlots();
    applyRestingStagger();
  };

  const applyFocusField = (focalId) => {
    Object.keys(cardRefs.current).forEach((otherId) => {
      const cardEl = cardRefs.current[otherId];
      if (!cardEl) return;

      const isFocal = String(otherId) === String(focalId);
      gsap.killTweensOf(cardEl, "opacity,filter");
      gsap.to(cardEl, {
        opacity: isFocal ? FOCAL_OPACITY : QUIET_OPACITY,
        filter: `brightness(${isFocal ? FOCAL_BRIGHTNESS : QUIET_BRIGHTNESS})`,
        duration: FOCUS_FIELD_DURATION,
        ease: EASE,
        overwrite: "auto",
      });
    });
  };

  const releaseFocusField = () => {
    Object.values(cardRefs.current).forEach((cardEl) => {
      if (!cardEl) return;
      gsap.killTweensOf(cardEl, "opacity,filter");
      gsap.to(cardEl, {
        opacity: FOCAL_OPACITY,
        filter: `brightness(${FOCAL_BRIGHTNESS})`,
        duration: FOCUS_FIELD_LEAVE_DURATION,
        ease: EASE,
        overwrite: "auto",
      });
    });
  };

  const computeFocusGeometry = (cardEl) => {
    const overlayEl = focusOverlayRef.current;
    if (!overlayEl || !cardEl) return null;

    const overlayRect = overlayEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    if (overlayRect.width === 0 || overlayRect.height === 0) return null;

    const originX = cardRect.left + cardRect.width / 2 - overlayRect.left;
    const originY = cardRect.top + cardRect.height / 2 - overlayRect.top;
    const dx = Math.max(originX, overlayRect.width - originX);
    const dy = Math.max(originY, overlayRect.height - originY);

    return { x: originX, y: originY, maxRadius: Math.sqrt(dx * dx + dy * dy) };
  };

  const hardResetFocusOverlay = () => {
    if (focusTweenRef.current) {
      focusTweenRef.current.kill();
      focusTweenRef.current = null;
    }
    focusEngagedRef.current = false;
    const overlayEl = focusOverlayRef.current;
    if (overlayEl) {
      gsap.set(overlayEl, { opacity: 0, "--focus-reveal": 0, "--focus-hole": 0 });
    }
  };

  const startFocusDarkPulse = (id) => {
    const overlayEl = focusOverlayRef.current;
    const cardEl = cardRefs.current[id];
    if (!overlayEl || !cardEl) return;

    const geometry = computeFocusGeometry(cardEl);
    if (!geometry) return;

    const wasEngaged = focusEngagedRef.current;
    focusEngagedRef.current = true;
    focusOriginRef.current = { x: geometry.x, y: geometry.y };
    focusMaxRadiusRef.current = geometry.maxRadius;

    if (focusTweenRef.current) {
      focusTweenRef.current.kill();
      focusTweenRef.current = null;
    }

    gsap.set(overlayEl, { "--focus-x": geometry.x, "--focus-y": geometry.y, opacity: 1 });

    if (wasEngaged) {
      focusTweenRef.current = gsap.to(overlayEl, {
        "--focus-hole": 0,
        "--focus-reveal": geometry.maxRadius,
        duration: FOCUS_RECENTER_DURATION,
        ease: FOCUS_PULSE_EASE,
        overwrite: "auto",
        onComplete: () => {
          focusTweenRef.current = null;
        },
      });
      return;
    }

    gsap.set(overlayEl, { "--focus-reveal": 0, "--focus-hole": 0 });
    focusTweenRef.current = gsap.to(overlayEl, {
      "--focus-reveal": geometry.maxRadius,
      duration: FOCUS_PULSE_DURATION,
      ease: FOCUS_PULSE_EASE,
      overwrite: "auto",
      onComplete: () => {
        focusTweenRef.current = null;
      },
    });
  };

  const startFocusClearPulse = () => {
    const overlayEl = focusOverlayRef.current;
    if (!overlayEl || !focusEngagedRef.current) return;

    focusEngagedRef.current = false;

    const maxRadius = Math.max(focusMaxRadiusRef.current, 1);
    const currentReveal = gsap.getProperty(overlayEl, "--focus-reveal") || 0;

    if (focusTweenRef.current) {
      focusTweenRef.current.kill();
      focusTweenRef.current = null;
    }

    gsap.set(overlayEl, {
      "--focus-x": focusOriginRef.current.x,
      "--focus-y": focusOriginRef.current.y,
    });

    const revealRatio = Math.min(currentReveal / maxRadius, 1) || 0;
    const duration = Math.max(FOCUS_CLEAR_DURATION * revealRatio, 0.35);

    focusTweenRef.current = gsap.to(overlayEl, {
      "--focus-hole": Math.max(currentReveal, maxRadius * 0.05),
      duration,
      ease: FOCUS_CLEAR_EASE,
      overwrite: "auto",
      onComplete: () => {
        focusTweenRef.current = null;
        gsap.set(overlayEl, { opacity: 0, "--focus-reveal": 0, "--focus-hole": 0 });
      },
    });
  };

  const runCardActivation = (id, e) => {
    const overlayEl = activationOverlayRefs.current[id];
    const frontFaceEl = frontFaceRefs.current[id];
    if (!overlayEl || !frontFaceEl) return;

    const feRect = frontFaceEl.getBoundingClientRect();
    if (feRect.width === 0 || feRect.height === 0) return;

    const originX = Math.min(Math.max(((e.clientX - feRect.left) / feRect.width) * 100, 0), 100);
    const originY = Math.min(Math.max(((e.clientY - feRect.top) / feRect.height) * 100, 0), 100);

    if (activationTimelineRefs.current[id]) {
      activationTimelineRefs.current[id].kill();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        delete activationTimelineRefs.current[id];
      },
    });
    activationTimelineRefs.current[id] = tl;

    tl.set(overlayEl, {
      "--activation-x": `${originX}%`,
      "--activation-y": `${originY}%`,
      "--activation-progress": 0,
      opacity: 1,
    });
    tl.to(
      overlayEl,
      {
        "--activation-progress": 1,
        duration: ACTIVATION_DURATION,
        ease: ACTIVATION_EASE,
      },
      0
    );
    tl.to(
      overlayEl,
      {
        opacity: 0,
        duration: ACTIVATION_FADE_DURATION,
        ease: "power1.out",
      },
      ACTIVATION_DURATION - ACTIVATION_FADE_DURATION
    );
  };

  const resetCardActivation = (id) => {
    const tl = activationTimelineRefs.current[id];
    if (tl) {
      tl.kill();
      delete activationTimelineRefs.current[id];
    }
    const overlayEl = activationOverlayRefs.current[id];
    if (overlayEl) {
      gsap.set(overlayEl, { opacity: 0, "--activation-progress": 0 });
    }
  };

  const resetAllCardActivations = () => {
    Object.keys(activationTimelineRefs.current).forEach((id) => {
      activationTimelineRefs.current[id].kill();
    });
    activationTimelineRefs.current = {};
    Object.values(activationOverlayRefs.current).forEach((overlayEl) => {
      if (overlayEl) {
        gsap.killTweensOf(overlayEl);
        gsap.set(overlayEl, { opacity: 0, "--activation-progress": 0 });
      }
    });
  };

  const getOriginPercent = (e, el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return { x: 50, y: 50 };
    }
    return {
      x: Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100),
      y: Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 0), 100),
    };
  };

  const startCardPulse = (id, originXPercent, originYPercent) => {
    const overlayEl = pulseOverlayRefs.current[id];
    if (!overlayEl) return;

    const alreadyPulsing = Boolean(pulseTimelineRefs.current[id]);

    if (!alreadyPulsing) {
      gsap.set(overlayEl, {
        "--pulse-x": originXPercent,
        "--pulse-y": originYPercent,
        "--pulse-alpha": 0,
        "--pulse-radius": 0,
        opacity: 1,
      });
    }

    if (!pulseFollowRefs.current[id]) {
      pulseFollowRefs.current[id] = {
        x: gsap.quickTo(overlayEl, "--pulse-x", {
          duration: PULSE_FOLLOW_DURATION,
          ease: "power2.out",
        }),
        y: gsap.quickTo(overlayEl, "--pulse-y", {
          duration: PULSE_FOLLOW_DURATION,
          ease: "power2.out",
        }),
      };
    }

    if (alreadyPulsing) return;

    const cycle = PULSE_CYCLE_MIN + Math.random() * (PULSE_CYCLE_MAX - PULSE_CYCLE_MIN);
    const riseDur = cycle * PULSE_RISE_FRACTION;
    const fallDur = cycle - riseDur;

    const tl = gsap.timeline({ repeat: -1 });

    tl.to(
      overlayEl,
      {
        "--pulse-alpha": PULSE_PEAK_ALPHA,
        duration: riseDur,
        ease: "sine.out",
      },
      0
    );

    tl.to(
      overlayEl,
      {
        "--pulse-radius": PULSE_MAX_RADIUS,
        duration: cycle,
        ease: "sine.out",
      },
      0
    );

    tl.to(
      overlayEl,
      {
        "--pulse-alpha": 0,
        duration: fallDur,
        ease: "sine.in",
      },
      riseDur
    );

    tl.set(overlayEl, { "--pulse-radius": 0 }, cycle);

    pulseTimelineRefs.current[id] = tl;
  };

  const updateCardPulseOrigin = (id, xPercent, yPercent) => {
    const follow = pulseFollowRefs.current[id];
    if (!follow) return;

    follow.x(xPercent);
    follow.y(yPercent);
  };

  const stopCardPulse = (id, { fade = true } = {}) => {
    const tl = pulseTimelineRefs.current[id];

    if (tl) {
      tl.kill();
      delete pulseTimelineRefs.current[id];
    }

    delete pulseFollowRefs.current[id];

    const overlayEl = pulseOverlayRefs.current[id];
    if (!overlayEl) return;

    gsap.killTweensOf(overlayEl);

    if (fade) {
      gsap.to(overlayEl, {
        "--pulse-alpha": 0,
        duration: PULSE_LEAVE_FADE,
        ease: "sine.out",
        overwrite: "auto",
        onComplete: () => {
          gsap.set(overlayEl, {
            "--pulse-radius": 0,
            opacity: 0,
          });
        },
      });
    } else {
      gsap.set(overlayEl, {
        "--pulse-alpha": 0,
        "--pulse-radius": 0,
        opacity: 0,
      });
    }
  };

  const stopAllCardPulses = () => {
    Object.keys(pulseOverlayRefs.current).forEach((id) => {
      stopCardPulse(id, { fade: false });
    });
  };

  const computeCalloutSide = (slotEl) => {
    const rect = slotEl.getBoundingClientRect();
    const needed = CALLOUT_LABEL_WIDTH + CALLOUT_GAP + CALLOUT_STUB + 24;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    if (spaceRight >= needed) return "right";
    if (spaceLeft >= needed) return "left";
    return spaceRight >= spaceLeft ? "right" : "left";
  };

  const computeCalloutRaw = (id, side) => {
    const cardEl = cardRefs.current[id];
    if (!cardEl) return null;

    const rect = cardEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const cardLeft = rect.left;
    const cardTop = rect.top;
    const cardRight = rect.right;
    const cardCenterY = cardTop + rect.height / 2;

    const anchor =
      side === "right"
        ? { x: cardRight, y: cardCenterY }
        : { x: cardLeft, y: cardCenterY };

    const labelX =
      side === "right"
        ? cardRight + CALLOUT_GAP
        : cardLeft - CALLOUT_GAP - CALLOUT_LABEL_WIDTH;

    let labelY = cardCenterY - CALLOUT_LABEL_HEIGHT_ESTIMATE / 2;
    labelY = Math.min(
      Math.max(labelY, CALLOUT_VIEWPORT_MARGIN),
      window.innerHeight - CALLOUT_LABEL_HEIGHT_ESTIMATE - CALLOUT_VIEWPORT_MARGIN
    );

    return { anchor, labelTarget: { x: labelX, y: labelY } };
  };

  const buildCalloutPath = (anchor, labelAnchor, side) => {
    const stubX = side === "right" ? anchor.x + CALLOUT_STUB : anchor.x - CALLOUT_STUB;
    return `M ${anchor.x} ${anchor.y} L ${stubX} ${anchor.y} L ${stubX} ${labelAnchor.y} L ${labelAnchor.x} ${labelAnchor.y}`;
  };

  const getCalloutLabelAnchor = (labelX, labelY, side) =>
    side === "right"
      ? { x: labelX, y: labelY + CALLOUT_LABEL_ANCHOR_OFFSET_Y }
      : { x: labelX + CALLOUT_LABEL_WIDTH, y: labelY + CALLOUT_LABEL_ANCHOR_OFFSET_Y };

  const randomScrambleChar = () =>
    SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];

  const buildResolveThresholds = (length) => {
    const thresholds = new Array(length);
    for (let i = 0; i < length; i++) {
      const base = length > 1 ? i / (length - 1) : 0;
      thresholds[i] = Math.min(base * 0.75 + Math.random() * 0.25, 1);
    }
    return thresholds;
  };

  const renderDecodeText = (el, text, thresholds, progress) => {
    if (!el) return;
    if (progress >= 1) {
      el.textContent = text;
      return;
    }
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === " ") {
        out += ch;
      } else if (progress >= thresholds[i]) {
        out += ch;
      } else {
        out += randomScrambleChar();
      }
    }
    el.textContent = out;
  };

  const triggerDecodeAudioHook = () => { };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
      : "TBA";

  const getVenueName = (venue) => (typeof venue === "object" ? venue?.name : venue);

  const hardResetCallout = () => {
    if (calloutTimelineRef.current) {
      calloutTimelineRef.current.kill();
      calloutTimelineRef.current = null;
    }
    calloutAnimatingRef.current = false;
    calloutVisibleRef.current = false;

    const labelEl = calloutLabelRef.current;
    const pathEl = calloutPathRef.current;
    if (labelEl) {
      gsap.killTweensOf(labelEl);
      gsap.set(labelEl, { opacity: 0 });
    }
    if (pathEl) {
      gsap.killTweensOf(pathEl);
      gsap.set(pathEl, { opacity: 0 });
    }
  };

  const fadeOutCallout = () => {
    if (!calloutVisibleRef.current) return;

    if (calloutTimelineRef.current) {
      calloutTimelineRef.current.kill();
      calloutTimelineRef.current = null;
    }
    calloutAnimatingRef.current = false;
    calloutVisibleRef.current = false;

    const labelEl = calloutLabelRef.current;
    const pathEl = calloutPathRef.current;

    if (labelEl) {
      gsap.killTweensOf(labelEl);
      gsap.to(labelEl, {
        opacity: 0,
        duration: CALLOUT_EXIT_DURATION,
        ease: EASE,
        overwrite: "auto",
        onComplete: () => setCalloutWorkshop(null),
      });
    } else {
      setCalloutWorkshop(null);
    }

    if (pathEl) {
      gsap.killTweensOf(pathEl);
      gsap.to(pathEl, {
        opacity: 0,
        duration: CALLOUT_EXIT_DURATION,
        ease: EASE,
        overwrite: "auto",
      });
    }
  };

  const startCallout = (id, slotEl, workshop) => {
    hardResetCallout();

    const labelEl = calloutLabelRef.current;
    const pathEl = calloutPathRef.current;
    if (!labelEl || !pathEl) return;

    const side = computeCalloutSide(slotEl);
    calloutSideRef.current = side;
    setCalloutSide(side);
    setCalloutWorkshop(workshop);

    const titleText = String(workshop.fullTitle ?? workshop.title ?? "Untitled").toUpperCase();
    const venueName = getVenueName(workshop.venue);
    const metaText = `${workshop.dateMonth} ${workshop.dateDay}${workshop.time ? ` · ${workshop.time}` : ""}${venueName ? ` · ${venueName}` : ""}`;
    const descText = String(workshop.description ?? "No description available");
    const priceText = `${workshop.fee != null ? workshop.fee : "N/A"}`;

    calloutDecodeRef.current = {
      title: { text: titleText, thresholds: buildResolveThresholds(titleText.length) },
      meta: { text: metaText, thresholds: buildResolveThresholds(metaText.length) },
      desc: { text: descText, thresholds: buildResolveThresholds(descText.length) },
      price: { text: priceText, thresholds: buildResolveThresholds(priceText.length) },
    };

    if (calloutTitleRef.current) calloutTitleRef.current.textContent = "";
    if (calloutMetaRef.current) calloutMetaRef.current.textContent = "";
    if (calloutDescRef.current) calloutDescRef.current.textContent = "";
    if (calloutPriceRef.current) calloutPriceRef.current.textContent = "";

    const geometry = computeCalloutRaw(id, side);
    if (!geometry) return;

    gsap.set(labelEl, { x: geometry.labelTarget.x, y: geometry.labelTarget.y, opacity: 0 });

    const labelAnchor = getCalloutLabelAnchor(geometry.labelTarget.x, geometry.labelTarget.y, side);
    const pathD = buildCalloutPath(geometry.anchor, labelAnchor, side);
    pathEl.setAttribute("d", pathD);
    const length = pathEl.getTotalLength();
    gsap.set(pathEl, {
      opacity: 1,
      strokeDasharray: length,
      strokeDashoffset: length,
    });

    calloutVisibleRef.current = true;
    calloutAnimatingRef.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        calloutAnimatingRef.current = false;
      },
    });
    calloutTimelineRef.current = tl;

    tl.to(labelEl, { opacity: 1, duration: CALLOUT_CONTAINER_FADE_IN, ease: "power1.out" }, 0);
    tl.to(pathEl, { strokeDashoffset: 0, duration: LINE_DRAW_DURATION, ease: LINE_DRAW_EASE }, 0);

    const titleProxy = { p: 0 };
    tl.to(
      titleProxy,
      {
        p: 1,
        duration: TITLE_DECODE_DURATION,
        ease: "none",
        onStart: triggerDecodeAudioHook,
        onUpdate: () =>
          renderDecodeText(
            calloutTitleRef.current,
            calloutDecodeRef.current.title.text,
            calloutDecodeRef.current.title.thresholds,
            titleProxy.p
          ),
      },
      TITLE_START
    );

    const metaProxy = { p: 0 };
    tl.to(
      metaProxy,
      {
        p: 1,
        duration: META_DECODE_DURATION,
        ease: "none",
        onUpdate: () =>
          renderDecodeText(
            calloutMetaRef.current,
            calloutDecodeRef.current.meta.text,
            calloutDecodeRef.current.meta.thresholds,
            metaProxy.p
          ),
      },
      META_START
    );

    const descProxy = { p: 0 };
    tl.to(
      descProxy,
      {
        p: 1,
        duration: DESC_DECODE_DURATION,
        ease: "none",
        onUpdate: () =>
          renderDecodeText(
            calloutDescRef.current,
            calloutDecodeRef.current.desc.text,
            calloutDecodeRef.current.desc.thresholds,
            descProxy.p
          ),
      },
      DESC_START
    );

    const priceProxy = { p: 0 };
    tl.to(
      priceProxy,
      {
        p: 1,
        duration: PRICE_DECODE_DURATION,
        ease: "none",
        onUpdate: () =>
          renderDecodeText(
            calloutPriceRef.current,
            calloutDecodeRef.current.price.text,
            calloutDecodeRef.current.price.thresholds,
            priceProxy.p
          ),
      },
      PRICE_START
    );
  };

  // Continuous propagation ticker
  if (tickRef.current === null) {
    tickRef.current = () => {
      const focalId = focusedIdRef.current;
      if (focalId === null) return;

      const focalCard = cardRefs.current[focalId];
      const focalRect = rectCacheRef.current[focalId];
      if (!focalCard || !focalRect) return;

      const liveX = gsap.getProperty(focalCard, "x") || 0;
      const liveY = gsap.getProperty(focalCard, "y") || 0;
      const focalCx = focalRect.cx + liveX;
      const focalCy = focalRect.cy + liveY;
      const cellSpacing = focalRect.width + GRID_GAP_PX;

      const now = performance.now();
      const rampT = Math.min(1, (now - rampStartRef.current) / RAMP_IN_MS);
      const ramp = rampT * rampT * (3 - 2 * rampT);

      const deltaRatio = gsap.ticker.deltaRatio(60);

      Object.keys(cardRefs.current).forEach((otherId) => {
        if (String(otherId) === String(focalId)) return;

        const cardEl = cardRefs.current[otherId];
        const rc = rectCacheRef.current[otherId];
        if (!cardEl || !rc) return;

        const dx = rc.cx - focalCx;
        const dy = rc.cy - focalCy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        const steps = dist / cellSpacing;
        const influence = 1 / (1 + steps * steps * FALLOFF_STRENGTH);

        const targetX = dirX * influence * MAX_SURROUND_DISPLACEMENT * ramp;
        const targetY = dirY * influence * MAX_SURROUND_DISPLACEMENT * ramp;

        const lagFactor = FAR_LAG + influence * (NEAR_LAG - FAR_LAG);
        const frameFactor = 1 - Math.pow(1 - lagFactor, deltaRatio);

        const curX = gsap.getProperty(cardEl, "x") || 0;
        const curY = gsap.getProperty(cardEl, "y") || 0;

        gsap.set(cardEl, {
          x: curX + (targetX - curX) * frameFactor,
          y: curY + (targetY - curY) * frameFactor,
        });
      });

      if (calloutVisibleRef.current) {
        const side = calloutSideRef.current;
        const raw = computeCalloutRaw(focalId, side);
        const labelEl = calloutLabelRef.current;
        const pathEl = calloutPathRef.current;

        if (raw && labelEl && pathEl) {
          const curLX = gsap.getProperty(labelEl, "x") || 0;
          const curLY = gsap.getProperty(labelEl, "y") || 0;
          const labelFrameFactor = 1 - Math.pow(1 - CALLOUT_LABEL_LAG, deltaRatio);
          const newLX = curLX + (raw.labelTarget.x - curLX) * labelFrameFactor;
          const newLY = curLY + (raw.labelTarget.y - curLY) * labelFrameFactor;
          gsap.set(labelEl, { x: newLX, y: newLY });

          const labelAnchor = getCalloutLabelAnchor(newLX, newLY, side);
          pathEl.setAttribute("d", buildCalloutPath(raw.anchor, labelAnchor, side));

          if (!calloutAnimatingRef.current) {
            const len = pathEl.getTotalLength();
            pathEl.setAttribute("stroke-dasharray", String(len));
            pathEl.setAttribute("stroke-dashoffset", "0");
          }
        }
      }
    };
  }

  const startTicker = () => {
    if (tickerRunningRef.current) return;
    tickerRunningRef.current = true;
    gsap.ticker.add(tickRef.current);
  };

  const stopTicker = () => {
    if (!tickerRunningRef.current) return;
    tickerRunningRef.current = false;
    gsap.ticker.remove(tickRef.current);
  };

  const handleCardEnter = (id, e, workshop) => {
    if (isNavigatingRef.current) return;
    if (!isFinePointer.current || prefersReducedMotion.current) return;

    const slotEl = slotRefs.current[id];
    const cardEl = cardRefs.current[id];
    if (!slotEl || !cardEl) return;

    const idleWeightObj = idleWeightsRef.current[id] || (idleWeightsRef.current[id] = { weight: 1 });
    gsap.killTweensOf(idleWeightObj);
    gsap.to(idleWeightObj, {
      weight: 0,
      duration: IDLE_YIELD_DURATION,
      ease: "power2.out",
      overwrite: "auto",
    });

    slotEl.style.zIndex = "20";

    const wasFieldActive = fieldActiveRef.current;

    if (!wasFieldActive) {
      fieldActiveRef.current = true;
      rampStartRef.current = performance.now();
      measureSlots();
      startTicker();
    }

    focusedIdRef.current = id;

    const { x, y, rotationX, rotationY } = getPointerResponse(e, slotEl);

    gsap.killTweensOf(cardEl, "x,y,rotationX,rotationY,scale,z,boxShadow,backgroundColor");
    gsap.to(cardEl, {
      x,
      y,
      rotationX,
      rotationY,
      scale: HOVER_SCALE,
      z: LIFT_Z,
      boxShadow: HOVER_SHADOW,
      backgroundColor: FOCUS_EDGE_BG,
      duration: ENTER_DURATION,
      ease: EASE,
      overwrite: "auto",
    });

    const frontFaceEl = frontFaceRefs.current[id];
    if (frontFaceEl) {
      gsap.killTweensOf(frontFaceEl);
      gsap.to(frontFaceEl, {
        borderTopColor: FOCUS_EDGE_HIGHLIGHT_TOP,
        borderLeftColor: FOCUS_EDGE_HIGHLIGHT_LEFT,
        duration: ENTER_DURATION,
        ease: EASE,
        overwrite: "auto",
      });
    }

    applyFocusField(id);
    startFocusDarkPulse(id);
    runCardActivation(id, e);

    const pulseFrontFaceEl = frontFaceRefs.current[id];
    if (pulseFrontFaceEl) {
      const pulseOrigin = getOriginPercent(e, pulseFrontFaceEl);
      startCardPulse(id, pulseOrigin.x, pulseOrigin.y);
    }

    startCallout(id, slotEl, workshop);
  };

  const handleCardMove = (id, e) => {
    if (isNavigatingRef.current) return;
    if (!isFinePointer.current || prefersReducedMotion.current) return;

    const slotEl = slotRefs.current[id];
    const cardEl = cardRefs.current[id];
    if (!slotEl || !cardEl) return;

    const { x, y, rotationX, rotationY } = getPointerResponse(e, slotEl);

    gsap.to(cardEl, {
      x,
      y,
      rotationX,
      rotationY,
      duration: MOVE_DURATION,
      ease: EASE,
      overwrite: "auto",
    });

    const pulseFrontFaceEl = frontFaceRefs.current[id];
    if (pulseFrontFaceEl) {
      const pulseOrigin = getOriginPercent(e, pulseFrontFaceEl);
      updateCardPulseOrigin(id, pulseOrigin.x, pulseOrigin.y);
    }
  };

  const handleCardLeave = (id) => {
    if (isNavigatingRef.current) return;
    if (!isFinePointer.current) return;

    const slotEl = slotRefs.current[id];
    const cardEl = cardRefs.current[id];
    if (!slotEl || !cardEl) return;

    const idleWeightObj = idleWeightsRef.current[id] || (idleWeightsRef.current[id] = { weight: 0 });
    gsap.killTweensOf(idleWeightObj);
    gsap.to(idleWeightObj, {
      weight: 1,
      duration: IDLE_RESTORE_DURATION,
      delay: 0.1,
      ease: "power2.inOut",
      overwrite: "auto",
    });

    gsap.killTweensOf(cardEl, "x,y,rotationX,rotationY,scale,z,boxShadow,backgroundColor");
    gsap.to(cardEl, {
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      z: 0,
      boxShadow: REST_SHADOW,
      backgroundColor: REST_EDGE_BG,
      duration: LEAVE_DURATION,
      ease: EASE,
      overwrite: "auto",
    });

    const frontFaceEl = frontFaceRefs.current[id];
    if (frontFaceEl) {
      gsap.killTweensOf(frontFaceEl);
      gsap.to(frontFaceEl, {
        borderTopColor: REST_EDGE_HIGHLIGHT_TOP,
        borderLeftColor: REST_EDGE_HIGHLIGHT_LEFT,
        duration: LEAVE_DURATION,
        ease: EASE,
        overwrite: "auto",
      });
    }

    slotEl.style.zIndex = "1";
    resetCardActivation(id);
    stopCardPulse(id);

    if (String(focusedIdRef.current) === String(id)) {
      fadeOutCallout();
      focusedIdRef.current = null;

      requestAnimationFrame(() => {
        if (focusedIdRef.current === null) {
          startFocusClearPulse();
        }
      });
    }
  };

  const handleGridLeave = () => {
    if (isNavigatingRef.current) return;
    if (!isFinePointer.current) return;
    if (!fieldActiveRef.current) return;

    fieldActiveRef.current = false;
    focusedIdRef.current = null;
    stopTicker();

    Object.keys(cardRefs.current).forEach((id) => {
      const cardEl = cardRefs.current[id];
      const slotEl = slotRefs.current[id];
      if (!cardEl) return;

      gsap.killTweensOf(cardEl, "x,y,rotationX,rotationY,scale,z,boxShadow");
      gsap.to(cardEl, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        z: 0,
        boxShadow: REST_SHADOW,
        duration: FIELD_RETURN_DURATION,
        ease: EASE,
        overwrite: "auto",
      });

      if (slotEl) slotEl.style.zIndex = "1";
    });

    Object.keys(floatRefs.current).forEach((cardId) => {
      const wObj = idleWeightsRef.current[cardId] || (idleWeightsRef.current[cardId] = { weight: 0 });
      gsap.killTweensOf(wObj);
      gsap.to(wObj, {
        weight: 1,
        duration: IDLE_RESTORE_DURATION,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    });

    releaseFocusField();
    fadeOutCallout();
    resetAllCardActivations();
    stopAllCardPulses();
    startFocusClearPulse();
  };

  useEffect(() => {
    fieldActiveRef.current = false;
    focusedIdRef.current = null;
    stopTicker();

    if (pageRef.current) {
      gsap.set(pageRef.current, { opacity: 1, scale: 1 });
    }

    Object.values(cardRefs.current).forEach((cardEl) => {
      if (cardEl) {
        gsap.killTweensOf(cardEl);
        gsap.set(cardEl, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          z: 0,
          scale: 1,
          boxShadow: REST_SHADOW,
          backgroundColor: REST_EDGE_BG,
          opacity: FOCAL_OPACITY,
          filter: `brightness(${FOCAL_BRIGHTNESS})`,
        });
      }
    });
    Object.values(frontFaceRefs.current).forEach((frontFaceEl) => {
      if (frontFaceEl) {
        gsap.killTweensOf(frontFaceEl);
        gsap.set(frontFaceEl, {
          borderTopColor: REST_EDGE_HIGHLIGHT_TOP,
          borderLeftColor: REST_EDGE_HIGHLIGHT_LEFT,
        });
      }
    });
    Object.values(slotRefs.current).forEach((slotEl) => {
      if (slotEl) {
        slotEl.style.zIndex = "1";
      }
    });
    Object.values(floatRefs.current).forEach((floatEl) => {
      if (floatEl) {
        gsap.set(floatEl, { x: 0, y: 0, rotationZ: 0, rotationX: 0 });
      }
    });
    Object.keys(idleWeightsRef.current).forEach((cardId) => {
      const wObj = idleWeightsRef.current[cardId];
      if (wObj) {
        gsap.killTweensOf(wObj);
        wObj.weight = 1;
      }
    });

    hardResetCallout();
    setCalloutWorkshop(null);
    resetAllCardActivations();
    stopAllCardPulses();
    hardResetFocusOverlay();
    remeasureAndStagger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    const handleResize = () => {
      if (!isFinePointer.current) return;
      remeasureAndStagger();

      if (focusEngagedRef.current && focusedIdRef.current !== null) {
        const cardEl = cardRefs.current[focusedIdRef.current];
        const overlayEl = focusOverlayRef.current;
        if (cardEl && overlayEl) {
          const geometry = computeFocusGeometry(cardEl);
          if (geometry) {
            focusOriginRef.current = { x: geometry.x, y: geometry.y };
            focusMaxRadiusRef.current = geometry.maxRadius;
            gsap.set(overlayEl, {
              "--focus-x": geometry.x,
              "--focus-y": geometry.y,
              "--focus-reveal": geometry.maxRadius,
            });
          }
        }
      }
    };
    const handleScroll = () => {
      if (fieldActiveRef.current) {
        measureSlots();
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      stopTicker();
      resetAllCardActivations();
      stopAllCardPulses();
      hardResetCallout();
      hardResetFocusOverlay();
      if (idleTickRef.current) {
        gsap.ticker.remove(idleTickRef.current);
      }
      if (entranceTlRef.current) {
        entranceTlRef.current.kill();
        entranceTlRef.current = null;
      }
      if (transitionTlRef.current) {
        transitionTlRef.current.kill();
        transitionTlRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Scroll progress for the staggered workshop columns
  const [scrollProgress, setScrollProgress] = useState(0);
  const gridRef = React.useRef(null);
  const lastRowRef = React.useRef(null);
  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || !lastRowRef.current) return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const lastRowRect = lastRowRef.current.getBoundingClientRect();

      const gridTop = window.scrollY + gridRect.top;
      const lastRowTop = window.scrollY + lastRowRect.top;

      // Start when the grid enters the viewport
      const start = gridTop - window.innerHeight;
      
      // End exactly when the last row fully enters the viewport
      const end = lastRowTop + lastRowRect.height - window.innerHeight;

      const progress = (window.scrollY - start) / (end - start);

      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);
  // Filtered workshops
  const filteredWorkshops = useMemo(() => {
    return WORKSHOPS_DATA.filter((item) => {
      const query = searchQuery.trim().toLowerCase();

      return (
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.fullTitle.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.instructor.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#06070d] text-slate-100 font-sans relative overflow-x-clip selection:bg-indigo-600 selection:text-white pb-24">

      {/* BACKGROUND AMBIENT STARS & GRADIENT */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-950/20 via-purple-950/10 to-transparent blur-3xl" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-30 w-full border-t-2 border-[#0091ff] border-b border-white/5 bg-[#05060d]/90 backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">

            <div className="relative h-8 sm:h-9 w-9 sm:w-10 flex items-center justify-center">
              <Image
                src="/images/tathva-emblem.png"
                alt="Tathva Logo"
                width={40}
                height={36}
                priority
                className="object-contain h-8 sm:h-9 w-auto group-hover:scale-105 transition-transform"
              />
            </div>

            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Tathva</span>

              <span className="font-fragment-serif text-2xl sm:text-3xl font-extrabold text-white leading-none">
                26
              </span>
            </span>

          </Link>

          {/* Desktop Right Actions */}
          <div className="flex items-center gap-3">

            <button
              type="button"
              className="px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md bg-[#5B63E6] hover:bg-[#4E56D8] active:scale-95 text-white transition-all duration-200 shadow-sm cursor-pointer"
            >
              Sign In
            </button>

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <rect
                      x="2"
                      y="5.5"
                      width="20"
                      height="2.2"
                      rx="1.1"
                    />

                    <rect
                      x="2"
                      y="11"
                      width="13"
                      height="2.2"
                      rx="1.1"
                    />

                    <path
                      d="M18.8 8.8C18.8 10.5 19.6 11.4 21.2 11.7C21.4 11.7 21.4 12.3 21.2 12.3C19.6 12.6 18.8 13.5 18.8 15.2C18.8 13.5 18 12.6 16.4 12.3C16.2 12.3 16.2 11.7 16.4 11.7C18 11.4 18.8 10.5 18.8 8.8Z"
                    />

                    <rect
                      x="2"
                      y="16.5"
                      width="20"
                      height="2.2"
                      rx="1.1"
                    />
                  </>
                )}
              </svg>
            </button>

          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-IN MENU */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-48 sm:w-56 bg-[#090b16] border-l border-white/10 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-end p-4">

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-white hover:text-slate-300 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

        </div>

        <nav className="px-4 space-y-1 text-sm font-medium">

          <Link
            href="/"
            className="block px-3 py-3 rounded-md hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
          >
            Home
          </Link>

          <Link
            href="/events"
            className="block px-3 py-3 rounded-md hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
          >
            Events
          </Link>

          <Link
            href="/workshops"
            className="block px-3 py-3 rounded-md bg-indigo-600/20 text-indigo-400 font-semibold"
          >
            Workshops
          </Link>

          <Link
            href="/lectures"
            className="block px-3 py-3 rounded-md hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
          >
            Lectures
          </Link>

          <Link
            href="/contact"
            className="block px-3 py-3 rounded-md hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
          >
            Contact Us
          </Link>

        </nav>
      </div>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pt-4">

        {/* HERO COSMIC EXPLOSION BANNER */}
        <div className="relative w-full overflow-hidden group mb-8">

          <div className="relative h-44 sm:h-64 md:h-72 w-full">

            <Image
              src="/images/cosmic-banner.png"
              alt="Tathva '26 Workshops Cosmic Supernova Banner"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1280px"
              className="object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#06070d] via-transparent to-transparent opacity-80" />

            <div className="absolute inset-0 bg-gradient-to-b from-[#06070d]/50 via-transparent to-transparent" />

          </div>
        </div>

        {/* TITLE & DESCRIPTION HEADER SECTION */}
        <section className="mb-6 border-b border-white/50 pb-5">

          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">

            {/* LEFT TITLE */}
            <div className="w-full md:w-[60%]">

              <h1
                style={{
                  fontFamily: "'Jaro', sans-serif",
                  fontSize: "clamp(55px, 5vw, 70px)",
                  fontWeight: 400,
                }}
                className="text-white leading-none m-0"
              >
                WORKSHOPS
              </h1>

            </div>

            {/* RIGHT DESCRIPTION */}
            <div className="w-full md:w-[40%] flex items-center">

              <p className="text-xs text-slate-300 leading-relaxed max-w-lg m-0">

                Get ready to innovate and create. The{" "}

                <span className="font-bold text-white tracking-wide">
                  TATHVA&apos;26
                </span>{" "}

                Workshops bring you face-to-face with cutting-edge
                technologies and industry experts. Dive into interactive,
                practical sessions, build functional projects from scratch,
                and earn{" "}

                <span className="font-bold text-white">
                  Activity Points
                </span>{" "}

                along with an official{" "}

                <span className="font-bold text-white">
                  Certificate
                </span>{" "}

                to elevate your portfolio.

              </p>

            </div>

          </div>

        </section>

        {/* SEARCH BAR & CATEGORY FILTERS */}
        <section className="mb-10 flex flex-col items-center">

          {/* SEARCH INPUT */}
          <div className="relative w-full max-w-md sm:max-w-lg mb-5">

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full h-10 sm:h-11 pl-5 pr-11 text-xs sm:text-sm font-medium rounded-full bg-white text-slate-900 placeholder:text-slate-500 shadow-[0_2px_20px_rgba(255,255,255,0.15)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />

            {/* SEARCH ICON */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">

              <svg
                className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

            </div>

          </div>



        </section>

        {/* WORKSHOP CARDS GRID */}
        <section className="relative">

          {filteredWorkshops.length === 0 ? (

            <div className="py-20 text-center text-slate-400">

              <p className="text-lg">
                No workshops found matching your search.
              </p>

              <button
                onClick={() => {
                  setSearchQuery("");
                }}
                className="mt-3 text-sm text-indigo-400 hover:underline cursor-pointer"
              >
                Clear filters
              </button>

            </div>

          ) : (

            (() => {

              /*
               * Split the workshops into four columns.
               *
               * Column 1 → starts at 0px
               * Column 2 → starts at 60px
               * Column 3 → starts at 0px
               * Column 4 → starts at 60px
               *
               * As scrollProgress reaches 1,
               * all columns become aligned.
               */

              const columns = [
                filteredWorkshops.filter((_, i) => i % 4 === 0),
                filteredWorkshops.filter((_, i) => i % 4 === 1),
                filteredWorkshops.filter((_, i) => i % 4 === 2),
                filteredWorkshops.filter((_, i) => i % 4 === 3),
              ];

              return (

                <div
                  ref={gridRef}
                  id="workshop-grid"
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
                  onMouseLeave={handleGridLeave}
                >
                  {columns.map((column, columnIndex) => {

                    const initialOffset =
                      columnIndex % 2 === 0 ? 0 : 180;

                    const offset =
                      initialOffset * (1 - scrollProgress);

                    return (

                      <div
                        key={columnIndex}
                        className="flex flex-col gap-3 sm:gap-4 lg:gap-6"
                        style={{
                          transform: `translateY(${offset}px)`,
                        }}
                      >

                        {column.map((workshop, rowIndex) => (

                          <div
                            key={workshop.id}
                            className="relative"
                            ref={(el) => {
                              if (el) slotRefs.current[workshop.id] = el;
                              else delete slotRefs.current[workshop.id];
                              if (columnIndex === 0 && rowIndex === column.length - 1 && lastRowRef) {
                                lastRowRef.current = el;
                              }
                            }}
                            style={{
                              zIndex: 1,
                              transformOrigin: "center center",
                              willChange: "transform",
                            }}
                            onMouseEnter={(e) => handleCardEnter(workshop.id, e, workshop)}
                            onMouseMove={(e) => handleCardMove(workshop.id, e)}
                            onMouseLeave={() => handleCardLeave(workshop.id)}
                          >
                            <div
                              ref={(el) => {
                                if (el) floatRefs.current[workshop.id] = el;
                                else delete floatRefs.current[workshop.id];
                              }}
                              style={{
                                transformStyle: "preserve-3d",
                                willChange: "transform",
                              }}
                            >
                              <div
                                ref={(el) => {
                                  if (el) cardRefs.current[workshop.id] = el;
                                  else delete cardRefs.current[workshop.id];
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedWorkshop(workshop);
                                }}
                                className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#0d101c] cursor-pointer flex flex-col justify-between w-full h-full"
                                style={{
                                  transformStyle: "preserve-3d",
                                  transformOrigin: "center center",
                                  boxShadow: REST_SHADOW,
                                  backgroundColor: REST_EDGE_BG,
                                  willChange: "transform, box-shadow, background-color",
                                }}
                              >
                                <div
                                  ref={(el) => {
                                    if (el) frontFaceRefs.current[workshop.id] = el;
                                    else delete frontFaceRefs.current[workshop.id];
                                  }}
                                  className="relative flex flex-col justify-between w-full h-full"
                                  style={{
                                    transformStyle: "preserve-3d",
                                    borderTop: `1px solid ${REST_EDGE_HIGHLIGHT_TOP}`,
                                    borderLeft: `1px solid ${REST_EDGE_HIGHLIGHT_LEFT}`,
                                  }}
                                >

                                  {/* Step 9 — digital activation pixelated overlay */}
                                  <div
                                    ref={(el) => {
                                      if (el) activationOverlayRefs.current[workshop.id] = el;
                                      else delete activationOverlayRefs.current[workshop.id];
                                    }}
                                    className="workshop-activation-overlay pointer-events-none absolute inset-0 z-10"
                                  />

                                  {/* Step 10 — continuous digital pulse overlay */}
                                  <div
                                    ref={(el) => {
                                      if (el) pulseOverlayRefs.current[workshop.id] = el;
                                      else delete pulseOverlayRefs.current[workshop.id];
                                    }}
                                    className="workshop-pulse-overlay pointer-events-none absolute inset-0 z-10"
                                  />

                                  {/* CARD VISUAL ARTWORK */}
                                  <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                                    <Image
                                      src={workshop.image}
                                      alt={workshop.fullTitle}
                                      fill
                                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                      className="object-cover object-center transition-transform duration-500 ease-out"
                                    />
                                    {/* GRADIENT OVERLAY */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#06070d] via-transparent to-transparent opacity-85" />
                                  </div>

                                  {/* BOTTOM BAR */}
                                  <div className="relative z-10 w-full bg-[#080a14] border-t border-white/10 px-2 sm:px-2.5 py-1.5 flex items-center justify-between gap-1">
                                    {/* LEFT BADGE */}
                                    <div className="shrink-0 flex items-center gap-1 px-1 py-[1px] rounded border border-white/20 bg-white/5">
                                      <span className="text-[6px] sm:text-[7px] font-mono font-bold tracking-widest text-slate-300 uppercase leading-none">
                                        {workshop.badge}
                                      </span>
                                    </div>
                                    {/* CENTER TITLE */}
                                    <div className="flex-1 min-w-0 text-center">
                                      <p className="text-[9px] sm:text-[10px] font-bold text-white tracking-wide truncate">
                                        {viewDetailsMode ? workshop.fullTitle : workshop.title}
                                      </p>
                                    </div>
                                    {/* RIGHT DATE */}
                                    <div className="shrink-0 flex flex-col items-center justify-center leading-none pl-1">
                                      <span className="text-[5px] sm:text-[6px] font-extrabold text-slate-300 tracking-wider uppercase mb-[1px]">
                                        {workshop.dateMonth}
                                      </span>
                                      <span className="text-[9px] sm:text-[10px] font-black text-white">
                                        {workshop.dateDay}
                                      </span>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </div>
                          </div>))}

                      </div>

                    );

                  })}

                </div>

              );

            })()

          )}

        </section>

        {/* GSAP OVERLAYS AND PORTALS */}
        {mounted &&
          createPortal(
            <>
              {/* Step 11 — global dark focus overlay */}
              <div
                ref={focusOverlayRef}
                className="workshop-focus-overlay pointer-events-none fixed inset-0 z-10"
                style={{
                  opacity: 0,
                  backgroundColor: FOCUS_OVERLAY_COLOR,
                  maskImage: `radial-gradient(
                    circle at var(--focus-x, 50%) var(--focus-y, 50%),
                    transparent calc(var(--focus-hole, 0px) - ${FOCUS_MASK_EDGE}px),
                    rgba(0,0,0,1) calc(var(--focus-hole, 0px) + ${FOCUS_MASK_EDGE}px),
                    rgba(0,0,0,1) calc(var(--focus-reveal, 0px) - ${FOCUS_MASK_EDGE}px),
                    transparent calc(var(--focus-reveal, 0px) + ${FOCUS_MASK_EDGE}px)
                  )`,
                  WebkitMaskImage: `radial-gradient(
                    circle at var(--focus-x, 50%) var(--focus-y, 50%),
                    transparent calc(var(--focus-hole, 0px) - ${FOCUS_MASK_EDGE}px),
                    rgba(0,0,0,1) calc(var(--focus-hole, 0px) + ${FOCUS_MASK_EDGE}px),
                    rgba(0,0,0,1) calc(var(--focus-reveal, 0px) - ${FOCUS_MASK_EDGE}px),
                    transparent calc(var(--focus-reveal, 0px) + ${FOCUS_MASK_EDGE}px)
                  )`,
                }}
              />

              {/* Step 6 — annotation callout SVG & HTML */}
              <div
                ref={calloutOverlayRef}
                className="workshop-callout-overlay pointer-events-none fixed inset-0 z-50 overflow-hidden"
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    ref={calloutPathRef}
                    className="stroke-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  ref={calloutLabelRef}
                  className="absolute top-0 left-0 flex flex-col justify-end"
                  style={{ width: CALLOUT_LABEL_WIDTH }}
                >
                  <div
                    className={`flex flex-col ${
                      calloutSide === "right" ? "items-start" : "items-end text-right"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                      <span
                        ref={calloutMetaRef}
                        className="text-[10px] font-mono tracking-[0.15em] text-indigo-300 uppercase"
                      ></span>
                    </div>
                    <h3
                      ref={calloutTitleRef}
                      className="text-lg font-black text-white leading-tight mb-2 drop-shadow-md break-words"
                    ></h3>
                    <p
                      ref={calloutDescRef}
                      className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3 opacity-90 w-[95%]"
                    ></p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Registration
                      </span>
                      <div className="h-px w-6 bg-slate-700" />
                      <span
                        ref={calloutPriceRef}
                        className="text-sm font-black text-emerald-400"
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}

      </main>

      {/* GSAP SPECIFIC CSS */}
      <style jsx global>{`
        .workshop-pulse-overlay {
          background: radial-gradient(
            circle calc(var(--pulse-radius) * 1px) at calc(var(--pulse-x) * 1%) calc(var(--pulse-y) * 1%),
            rgba(255, 255, 255, var(--pulse-alpha)) 0%,
            transparent 100%
          );
          mix-blend-mode: overlay;
        }

        .workshop-activation-overlay {
          background: 
            radial-gradient(
              circle ${ACTIVATION_RING_SPREAD}px at calc(var(--activation-x)) calc(var(--activation-y)),
              rgba(255,255,255,0) calc((var(--activation-progress) * 100%) - ${ACTIVATION_RING_BAND}px),
              rgba(255,255,255,${ACTIVATION_GLOW_ALPHA}) calc(var(--activation-progress) * 100%),
              rgba(255,255,255,0) calc((var(--activation-progress) * 100%) + ${ACTIVATION_RING_BAND}px)
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent ${ACTIVATION_GRID_CELL - 1}px,
              rgba(255,255,255,${ACTIVATION_GRID_ALPHA}) ${ACTIVATION_GRID_CELL}px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent ${ACTIVATION_GRID_CELL - 1}px,
              rgba(255,255,255,${ACTIVATION_GRID_ALPHA}) ${ACTIVATION_GRID_CELL}px
            );
          mask-image: radial-gradient(
            circle ${ACTIVATION_RING_SPREAD}px at calc(var(--activation-x)) calc(var(--activation-y)),
            rgba(0,0,0,1) calc((var(--activation-progress) * 100%) - ${ACTIVATION_GRID_BAND}px),
            rgba(0,0,0,0) calc(var(--activation-progress) * 100%)
          );
          -webkit-mask-image: radial-gradient(
            circle ${ACTIVATION_RING_SPREAD}px at calc(var(--activation-x)) calc(var(--activation-y)),
            rgba(0,0,0,1) calc((var(--activation-progress) * 100%) - ${ACTIVATION_GRID_BAND}px),
            rgba(0,0,0,0) calc(var(--activation-progress) * 100%)
          );
          mix-blend-mode: overlay;
        }
      `}</style>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">

        <button
          type="button"
          onClick={() => setViewDetailsMode(!viewDetailsMode)}
          title={
            viewDetailsMode
              ? "Show Simple Titles"
              : "Show Full Titles"
          }
          className="w-13 h-13 rounded-2xl bg-[#2b354f] hover:bg-[#394668] active:scale-95 text-sky-200 hover:text-white border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-300 group cursor-pointer"
          aria-label="Toggle card details view"
        >

          {/* EYE ICON */}
          <svg
            className="w-4.5 h-4.5 group-hover:scale-110 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >

            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />

            <circle cx="12" cy="12" r="3" />

          </svg>

        </button>

      </div>

      {/* WORKSHOP DETAILS MODAL */}
      {selectedWorkshop && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedWorkshop(null)}
        >

          <div
            className="relative w-full max-w-xl bg-[#0d101d] border border-white/15 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-7 text-left"
            onClick={(e) => e.stopPropagation()}
          >

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setSelectedWorkshop(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >

              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />

              </svg>

            </button>

            {/* MODAL HEADER */}
            <div className="flex items-center gap-2 mb-3">

              <span className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase rounded border border-indigo-500/30 bg-indigo-950/50 text-indigo-300">
                {selectedWorkshop.category}
              </span>

              <span className="text-xs text-slate-400">
                {selectedWorkshop.dateMonth}{" "}
                {selectedWorkshop.dateDay}, 2026
              </span>

            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
              {selectedWorkshop.fullTitle}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
              {selectedWorkshop.description}
            </p>

            {/* SPEC DETAILS GRID */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs bg-white/5 p-4 rounded-xl border border-white/5">

              <div>
                <span className="text-slate-400 block font-medium">
                  Instructor:
                </span>

                <span className="text-white font-semibold">
                  {selectedWorkshop.instructor}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">
                  Duration:
                </span>

                <span className="text-white font-semibold">
                  {selectedWorkshop.duration}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">
                  Venue:
                </span>

                <span className="text-white font-semibold">
                  {selectedWorkshop.venue}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">
                  Benefits:
                </span>

                <span className="text-emerald-400 font-semibold">
                  {selectedWorkshop.activityPoints}
                </span>
              </div>

            </div>

            {/* PREREQUISITES */}
            <div className="mb-6 text-xs text-slate-300">

              <span className="text-slate-400 font-semibold">
                Prerequisites:{" "}
              </span>

              {selectedWorkshop.prerequisites}

            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">

              <div>

                <span className="text-xs text-slate-400 block">
                  Registration Fee
                </span>

                <span className="text-xl font-bold text-white">
                  {selectedWorkshop.fee}
                </span>

              </div>

              <div className="flex items-center gap-3">

                <span className="text-xs text-amber-400">
                  ⚡ Only {selectedWorkshop.spotsLeft} spots left
                </span>

                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
                >
                  Register Now
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}