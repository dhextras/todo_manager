import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingTooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
}

export default function FloatingTooltip({ content, children, delay = 500 }: FloatingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState('bottom');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = (rect: DOMRect) => {
    const tooltipWidth = 250;
    const tooltipHeight = 80;
    const margin = 10;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = rect.left + rect.width / 2 - tooltipWidth / 2;
    let y = rect.bottom + margin;
    let position = 'bottom';
    
    // Check if tooltip goes off right edge
    if (x + tooltipWidth > viewportWidth - margin) {
      x = viewportWidth - tooltipWidth - margin;
    }
    
    // Check if tooltip goes off left edge
    if (x < margin) {
      x = margin;
    }
    
    // Check if tooltip goes off bottom edge
    if (y + tooltipHeight > viewportHeight - margin) {
      y = rect.top - tooltipHeight - margin;
      position = 'top';
    }
    
    return { x, y, position };
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const { x, y, position } = calculatePosition(rect);
        setPosition({ x, y });
        setTooltipPosition(position);
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block w-full"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[200] pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              maxWidth: '250px',
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 rounded-lg p-3 shadow-2xl">
              <div className="text-white text-xs leading-relaxed break-words">
                {content}
              </div>
              
              {/* Arrow */}
              <div
                className={`absolute w-2 h-2 bg-gray-900/95 border-gray-600/50 transform rotate-45 ${
                  tooltipPosition === 'bottom' 
                    ? 'border-t border-l -top-1 left-1/2 -translate-x-1/2' 
                    : 'border-b border-r -bottom-1 left-1/2 -translate-x-1/2'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
