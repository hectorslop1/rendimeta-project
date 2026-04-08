"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Grainient effect - gradient with animated grain texture
    let time = 0;

    const createGrain = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 30; // Grain intensity
        data[i] = noise; // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 15; // A (low opacity for subtle effect)
      }

      return imageData;
    };

    const animate = () => {
      time += 0.003;

      // Create base gradient
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      gradient.addColorStop(0, "#fce7f3"); // pink-100
      gradient.addColorStop(0.3, "#f3e8ff"); // purple-100
      gradient.addColorStop(0.6, "#e0e7ff"); // indigo-100
      gradient.addColorStop(1, "#cffafe"); // cyan-100

      // Draw gradient base
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add animated color blobs
      const blob1 = ctx.createRadialGradient(
        canvas.width * (0.3 + Math.sin(time) * 0.1),
        canvas.height * (0.3 + Math.cos(time) * 0.1),
        0,
        canvas.width * 0.3,
        canvas.height * 0.3,
        canvas.width * 0.4,
      );
      blob1.addColorStop(0, "rgba(230, 0, 122, 0.15)"); // Magenta
      blob1.addColorStop(1, "rgba(230, 0, 122, 0)");
      ctx.fillStyle = blob1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const blob2 = ctx.createRadialGradient(
        canvas.width * (0.7 + Math.cos(time * 1.3) * 0.1),
        canvas.height * (0.6 + Math.sin(time * 1.3) * 0.1),
        0,
        canvas.width * 0.7,
        canvas.height * 0.6,
        canvas.width * 0.4,
      );
      blob2.addColorStop(0, "rgba(122, 40, 255, 0.15)"); // Púrpura
      blob2.addColorStop(1, "rgba(122, 40, 255, 0)");
      ctx.fillStyle = blob2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add grain texture overlay
      const grain = createGrain();
      ctx.putImageData(grain, 0, 0);

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{
        background:
          "linear-gradient(135deg, #fce7f3 0%, #f3e8ff 33%, #e0e7ff 66%, #cffafe 100%)",
        filter: "contrast(1.1) brightness(1.05)",
      }}
    />
  );
}
