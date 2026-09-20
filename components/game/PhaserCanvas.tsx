"use client";
import { useEffect, useRef } from "react";
import { useGame } from "@/store/gameStore";

interface Props {
  onGroundClick: (x: number, y: number) => void;
}

// Lightweight canvas renderer (Phaser-style side-view) without bundling Phaser on SSR.
// Uses plain Canvas 2D with parallax + click-to-move; members animate toward targets.
export default function PhaserCanvas({ onGroundClick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const members = useGame((s) => s.members);
  const mRef = useRef(members);
  mRef.current = members;
  const clickRef = useRef(onGroundClick);
  clickRef.current = onGroundClick;

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    const pos = new Map<string, { x: number; y: number }>();
    function resize() {
      cv.width = cv.clientWidth * devicePixelRatio;
      cv.height = cv.clientHeight * devicePixelRatio;
    }
    resize();
    window.addEventListener("resize", resize);
    function frame(t: number) {
      const W = cv.width, H = cv.height;
      // sky + parallax hills
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0b1026"); g.addColorStop(0.6, "#16213d"); g.addColorStop(1, "#1d2b1d");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(90,120,200,0.25)";
      for (let i = 0; i < 5; i++) {
        const bx = ((i * 500 - t * 0.01 * (i + 1)) % (W + 400) + W + 400) % (W + 400) - 200;
        ctx.beginPath(); ctx.ellipse(bx, H * 0.62, 320, 120, 0, 0, 7); ctx.fill();
      }
      // ground band
      ctx.fillStyle = "#2c3a26"; ctx.fillRect(0, H * 0.68, W, H * 0.32);
      ctx.fillStyle = "#3b4c30"; ctx.fillRect(0, H * 0.68, W, 8 * devicePixelRatio);
      // members
      const list = mRef.current;
      list.forEach((m, idx) => {
        const cur = pos.get(m.player_id) ?? { x: m.x, y: m.y };
        cur.x += (m.x - cur.x) * 0.08; cur.y += (m.y - cur.y) * 0.08;
        pos.set(m.player_id, cur);
        const sx = (cur.x / 2560) * W;
        const sy = H * 0.68 + ((cur.y - 400) / 300) * H * 0.22;
        const bob = Math.sin(t / 300 + idx) * 4 * devicePixelRatio;
        ctx.fillStyle = ["#7dd3fc", "#f9a8d4", "#fcd34d", "#86efac"][idx % 4];
        ctx.fillRect(sx - 12, sy - 44 + bob, 24, 36);
        ctx.fillStyle = "#000";
        ctx.fillRect(sx - 18, sy - 56 + bob, 36, 5);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(sx - 18, sy - 56 + bob, 36 * Math.max(0, m.hp / Math.max(1, m.maxHp)), 5);
        ctx.fillStyle = "#fff";
        ctx.font = `${10 * devicePixelRatio}px sans-serif`;
        ctx.fillText(m.username.slice(0, 10), sx - 18, sy - 60 + bob);
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    function click(e: MouseEvent) {
      const r = cv.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const wx = Math.round(px * 2560);
      const wy = Math.round(400 + Math.max(0, Math.min(1, (py - 0.68) / 0.22)) * 300);
      clickRef.current(wx, Math.max(400, Math.min(700, wy)));
    }
    cv.addEventListener("click", click);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); cv.removeEventListener("click", click); };
  }, []);

  return <canvas ref={ref} className="h-full w-full cursor-crosshair" aria-label="game canvas — click ground to move" />;
}
