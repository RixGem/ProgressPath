'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, X } from 'lucide-react'

export default function FlashcardNotes({ items, onClose, renderFront, renderBack, title = "Flashcards" }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    // Reset flip state when changing cards
    useEffect(() => {
        setIsFlipped(false)
    }, [currentIndex])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                handlePrev()
            } else if (e.key === 'ArrowRight') {
                handleNext()
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault() // Prevent scrolling
                setIsFlipped(prev => !prev)
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex, items.length])

    if (!items || items.length === 0) return null

    const handlePrev = () => {
        setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))
    }

    const handleNext = () => {
        setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
    }

    const currentItem = items[currentIndex]

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            {/* Header Controls */}
            <div className="w-full max-w-2xl flex justify-between items-center mb-4 text-white">
                <div className="font-semibold text-lg">{title} ({currentIndex + 1}/{items.length})</div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Flashcard Container */}
            <div className="relative w-full max-w-2xl aspect-[4/3] md:aspect-[16/9] perspective-1000">
                <div
                    className={`relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''
                        }`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front Side */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {renderFront(currentItem)}
                        </div>

                        {/* Front Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm text-gray-400 dark:text-gray-500">
                            <span>Front (Tap to flip)</span>
                            <RotateCw className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Back Side */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="transform rotate-y-0"> {/* Counteract content rotation if needed, but 'rotate-y-180' on parent handles it correctly for backface */}
                                {renderBack(currentItem)}
                            </div>
                        </div>

                        {/* Back Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm text-gray-400 dark:text-gray-500">
                            <span>Back (Tap to flip)</span>
                            <RotateCw className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-8 mt-6">
                <button
                    onClick={handlePrev}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <div className="flex space-x-2">
                    {items.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/30'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>

            {/* Helper Text */}
            <div className="mt-4 text-white/50 text-sm flex items-center space-x-4">
                <span className="flex items-center"><span className="border border-white/30 px-1.5 rounded text-xs mr-1.5">Space</span> Flip</span>
                <span className="flex items-center"><span className="border border-white/30 px-1.5 rounded text-xs mr-1.5">←/→</span> Navigate</span>
                <span className="flex items-center"><span className="border border-white/30 px-1.5 rounded text-xs mr-1.5">Esc</span> Close</span>
            </div>

            {/* CSS Utility for 3D Transform */}
            <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        /* Custom scrollbar for better look inside cards */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}</style>
        </div>
    )
}
