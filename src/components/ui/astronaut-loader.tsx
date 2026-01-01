"use client";

import * as React from "react";

export function AstronautLoader({ className }: { className?: string }) {
  return (
    <div className={`relative w-full h-[400px] overflow-hidden bg-background ${className ?? ""}`}>
      {/* Stars */}
      <div className="box-of-star1">
        <div className="star star-position1" />
        <div className="star star-position2" />
      </div>
      <div className="box-of-star2">
        <div className="star star-position3" />
        <div className="star star-position4" />
      </div>
      <div className="box-of-star3">
        <div className="star star-position5" />
        <div className="star star-position6" />
      </div>
      <div className="box-of-star4">
        <div className="star star-position7" />
      </div>

      {/* Astronaut */}
      <div className="astronaut">
        <div className="schoolbag" />
        <div className="head" />
        <div className="body">
          <div className="panel" />
        </div>
        <div className="arm arm-left" />
        <div className="arm arm-right" />
        <div className="leg leg-left" />
        <div className="leg leg-right" />
      </div>
    </div>
  );
}
