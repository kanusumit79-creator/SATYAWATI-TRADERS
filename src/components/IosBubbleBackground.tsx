import React from 'react';

/**
 * Clean, lightweight, high-performance background optimized for the owner.
 * Fast rendering with zero lag, crisp Apple neutral canvas.
 */
export const IosBubbleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 select-none overflow-hidden">
      {/* Crisp, clean background */}
      <div className="absolute inset-0 bg-[#F4F5F7]" />
      
      {/* Very subtle ambient highlights for depth without heavy blur lag */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.04] rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/[0.04] rounded-full filter blur-3xl pointer-events-none" />
    </div>
  );
};
