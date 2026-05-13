import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      {/* Amber top rule */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500/50" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center px-6 max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* Heading */}
        <p className="font-mono text-[11px] text-amber-500/70 tracking-[0.2em] uppercase mb-3">
          Signal not found
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
          This wasn't on today's signal.
        </h1>
        <p className="text-sm text-muted-foreground/70 leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved. Head back to the daily feed.
        </p>

        {/* CTA */}
        <Link href="/">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-all duration-150">
            <Newspaper className="w-4 h-4" />
            Back to Today's Desk
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
