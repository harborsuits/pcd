"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Award,
  Users,
  Calendar,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { motion, useScroll, useTransform, useInView, useSpring, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface ServiceItemData {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface StatData {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix: string;
}

interface AboutSectionProps {
  businessName: string;
  tagline?: string;
  services: ServiceItemData[];
  stats: StatData[];
  centerImageUrl?: string;
  onCtaClick?: () => void;
  ctaText?: string;
}

export function AboutSection({
  businessName,
  tagline,
  services,
  stats,
  centerImageUrl,
  onCtaClick,
  ctaText = "Get a Quote",
}: AboutSectionProps) {
  const sectionRef = useRef(null);
  const statsRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  const isStatsInView = useInView(statsRef, { once: false, amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -20]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const leftServices = services.slice(0, Math.ceil(services.length / 2));
  const rightServices = services.slice(Math.ceil(services.length / 2));

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-slate-50 py-20 md:py-28"
    >
      {/* Decorative background elements */}
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl"
      />
      <motion.div
        style={{ y: y2, rotate: rotate2 }}
        className="pointer-events-none absolute -right-20 bottom-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
      />
      <motion.div
        style={{ y: y1 }}
        className="pointer-events-none absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-slate-200/50 blur-2xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="pointer-events-none absolute right-1/3 bottom-1/4 h-56 w-56 rounded-full bg-blue-50/50 blur-3xl"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="container mx-auto px-4"
      >
        <motion.div variants={itemVariants} className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-900">
            <Zap className="h-4 w-4" />
            DISCOVER OUR STORY
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl lg:text-5xl">
            About {businessName}
          </h2>
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg"
          >
            {tagline || `We are a passionate team dedicated to delivering exceptional quality and service. With attention to detail and commitment to excellence, we transform visions into reality.`}
          </motion.p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <motion.div
            variants={containerVariants}
            className="flex flex-col justify-center space-y-6"
          >
            {leftServices.map((service, index) => (
              <ServiceItem
                key={index}
                icon={service.icon}
                title={service.title}
                description={service.description}
                variants={itemVariants}
                delay={index * 0.1}
                direction="left"
              />
            ))}
          </motion.div>

          {/* Center Image */}
          <motion.div
            variants={itemVariants}
            className="relative flex items-center justify-center"
          >
            {centerImageUrl ? (
              <div className="relative">
                <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl">
                  <img
                    src={centerImageUrl}
                    alt="Our Work"
                    className="h-[400px] w-full object-cover lg:h-[500px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 backdrop-blur-sm">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Our Portfolio
                    </span>
                  </div>
                </div>

                {/* Floating accent elements */}
                <motion.div
                  style={{ y: y1 }}
                  className="absolute -left-4 -top-4 h-24 w-24 rounded-2xl bg-blue-600 opacity-20"
                />
                <motion.div
                  style={{ y: y2 }}
                  className="absolute -bottom-4 -right-4 h-32 w-32 rounded-2xl bg-slate-900 opacity-10"
                />
              </div>
            ) : (
              <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-slate-900 lg:h-[500px]">
                <Star className="h-24 w-24 text-white/20" />
              </div>
            )}
          </motion.div>

          {/* Right Column */}
          <motion.div
            variants={containerVariants}
            className="flex flex-col justify-center space-y-6"
          >
            {rightServices.map((service, index) => (
              <ServiceItem
                key={index}
                icon={service.icon}
                title={service.title}
                description={service.description}
                variants={itemVariants}
                delay={index * 0.1}
                direction="right"
              />
            ))}
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          ref={statsRef}
          variants={containerVariants}
          initial="hidden"
          animate={isStatsInView ? "visible" : "hidden"}
          className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <StatCounter
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              delay={index * 0.1}
            />
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={itemVariants}
          className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl bg-slate-900 p-8 text-center md:flex-row md:text-left"
        >
          <div>
            <h3 className="text-2xl font-bold text-white">
              Ready to get started?
            </h3>
            <p className="mt-2 text-slate-300">
              Let's create something amazing together.
            </p>
          </div>
          <button
            onClick={onCtaClick}
            className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white transition-all hover:bg-blue-500"
          >
            {ctaText}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}

interface ServiceItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variants: Variants;
  delay: number;
  direction: "left" | "right";
}

function ServiceItem({ icon, title, description, variants, delay, direction }: ServiceItemProps) {
  return (
    <motion.div
      variants={variants}
      transition={{ delay }}
      className={cn(
        "group relative rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-lg",
        direction === "right" && "lg:text-right"
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center gap-3",
          direction === "right" && "lg:flex-row-reverse"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {title}
        </h3>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

interface StatCounterProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix: string;
  delay: number;
}

function StatCounter({ icon, value, label, suffix, delay }: StatCounterProps) {
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: false });
  const [hasAnimated, setHasAnimated] = useState(false);

  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 10,
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(value);
      setHasAnimated(true);
    } else if (!isInView && hasAnimated) {
      springValue.set(0);
      setHasAnimated(false);
    }
  }, [isInView, value, springValue, hasAnimated]);

  const displayValue = useTransform(springValue, (latest) => Math.floor(latest));

  return (
    <motion.div
      ref={countRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ delay, duration: 0.5 }}
      className="group flex flex-col items-center rounded-xl bg-white p-6 text-center shadow-sm transition-all hover:shadow-lg"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-900">
        <motion.span>{displayValue}</motion.span>
        {suffix}
      </div>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </motion.div>
  );
}

export default AboutSection;
