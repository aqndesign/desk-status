import mascot from '../../assets/lottie/campus-buddy.json';
import { LottiePlayer } from '../LottiePlayer';

/**
 * Campus Buddy's face, from Org Space Manager's voice home: a looping bot
 * that bobs, blinks and wags its antenna, with that project's colours baked
 * into the JSON (a navy visor, a cool white shell, periwinkle ears and
 * antenna). It fills its box; with reduced motion it holds its first frame.
 */
export default function BuddyMascot({ className }: { className?: string }) {
  return <LottiePlayer animationData={mascot} className={className} />;
}
