import React, { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

const icons = [
  "/icon-1.png",
  "/icon-1.png",
  "/icon-2.png",
  "/icon-2.png",
  "/icon-3.png",
  "/icon-3.png",
  "/icon-4.png",
  "/icon-4.png",
  "/icon-5.png",
  "/icon-5.png",
  "/icon-6.png",
  "/icon-6.png",
  "/icon-7.png",
  "/icon-7.png",
  "/icon-8.png",
  "/icon-8.png",
  "/icon-9.png",
  "/icon-9.png",
  "/icon-10.png",
  "/icon-10.png",
  "/icon-11.png",
  "/icon-11.png",
];

export default function FloatingIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useRef(icons.map(() => useAnimation()));
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();

    const positions = icons.map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2, // random horizontal velocity
      vy: (Math.random() - 0.5) * 2, // random vertical velocity
      rotation: Math.random() * 360,
    }));

    const animate = () => {
      positions.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce (invert velocity when hitting walls)
        if (p.x <= 0 || p.x >= width - 60) p.vx *= -1;
        if (p.y <= 0 || p.y >= height - 60) p.vy *= -1;

        p.rotation += 0.5;

        controls.current[i].start({
          x: p.x,
          y: p.y,
          rotate: p.rotation,
          transition: { duration: 0.05, ease: "linear" },
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation on next frame to ensure components are mounted
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
    >
      {icons.map((iconPath, i) => (
        <motion.div
          key={i}
          animate={controls.current[i]}
          className="absolute"
          style={{
            transform: `translate(${Math.random() * 400}px, ${
              Math.random() * 400
            }px)`,
          }}
        >
          <div className="absolute rounded-full size-[calc(100%+1rem)] -top-2 -left-2 bg-primary/15" />
          <img
            src={iconPath}
            alt={`floating icon ${i}`}
            className="w-12 h-12 object-contain"
          />
        </motion.div>
      ))}
    </div>
  );
}
