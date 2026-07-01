import type { HtpStep } from './HowToPlay';

/**
 * Short "How to play" rules shown over the board before each match begins, so
 * nobody is dropped cold into a game (which made fast bots feel unfair). Keyed
 * by game id; the engine renders these via the HowToPlay overlay. Keep each to
 * 2–3 tight steps — goal, how, win condition.
 */
export const HOWTO: Record<string, HtpStep[]> = {
  'color-cards': [
    { icon: '🎨', text: 'Play a card matching the color or number on the pile.' },
    { icon: '🃏', text: 'No match? Draw a card. Use action cards to attack rivals.' },
    { icon: '🏁', text: 'First to empty their hand wins.' }
  ],
  'water-sort': [
    { icon: '🎯', text: 'Pour to gather each color into its own tube.' },
    { icon: '💧', text: 'You can only pour onto a matching color (or an empty tube).' },
    { icon: '🏁', text: 'First to sort every tube wins the race.' }
  ],
  'color-blocks': [
    { icon: '🧱', text: 'Place the falling blocks to fill complete rows.' },
    { icon: '✨', text: 'Full lines clear and free up space.' },
    { icon: '🏁', text: 'Outlast your rival before the grid fills up.' }
  ],
  'nuts-and-bolts': [
    { icon: '🔩', text: 'Move nuts between bolts to group matching colors.' },
    { icon: '🎯', text: 'Stack each bolt into a single solid color.' },
    { icon: '🏁', text: 'Fastest to sort them all wins.' }
  ],
  'maze-paint': [
    { icon: '🖌️', text: 'Drag from the dot to paint tiles in one stroke.' },
    { icon: '↩️', text: 'You can’t cross your own path — plan the route.' },
    { icon: '🏁', text: 'First to paint every tile wins.' }
  ],
  'word-finder': [
    { icon: '🔤', text: 'Swipe the letter wheel to spell valid words.' },
    { icon: '⭐', text: 'Longer words score more points.' },
    { icon: '🏆', text: 'Highest score after both rounds wins.' }
  ],
  'merge-2048': [
    { icon: '↔️', text: 'Swipe to slide all tiles; equal tiles merge into one.' },
    { icon: '🔢', text: 'Keep merging to build bigger numbers.' },
    { icon: '🏆', text: 'Beat the bot’s score before the board locks up.' }
  ],
  'block-blast': [
    { icon: '🧩', text: 'Drag the pieces onto the grid.' },
    { icon: '💥', text: 'Fill full rows or columns to clear them for combos.' },
    { icon: '🏆', text: 'Outscore your rival before you run out of space.' }
  ],
  'traffic-jam': [
    { icon: '🚗', text: 'Slide cars forward and back to clear a path.' },
    { icon: '🔑', text: 'Free the red car out through the exit gap.' },
    { icon: '🏁', text: 'First to escape the jam wins.' }
  ],
  'memory-match': [
    { icon: '🃏', text: 'Flip two cards to find a matching pair.' },
    { icon: '🔁', text: 'Match and you go again; miss and it’s their turn.' },
    { icon: '🏆', text: 'Most pairs when the board clears wins.' }
  ],
  'tic-tac-toe': [
    { icon: '⭕', text: 'Take turns placing your mark on the grid.' },
    { icon: '📏', text: 'Line up three in a row — across, down, or diagonal.' },
    { icon: '🏆', text: 'Three in a row wins; a full board is a draw.' }
  ],
  'dots-boxes': [
    { icon: '✏️', text: 'Draw one line between two dots on your turn.' },
    { icon: '⬛', text: 'Close the 4th side of a box to claim it and go again.' },
    { icon: '🏆', text: 'Claim the most boxes to win.' }
  ],
  wordle: [
    { icon: '⌨️', text: 'Guess the hidden 5-letter word.' },
    { icon: '🟩', text: 'Green = right spot, yellow = wrong spot, grey = not in word.' },
    { icon: '🏁', text: 'Crack it in six tries before the bot does.' }
  ],
  'pipe-mania': [
    { icon: '🔧', text: 'Tap pipes to rotate them.' },
    { icon: '💧', text: 'Connect the water all the way to the flower.' },
    { icon: '🏁', text: 'First to complete the flow wins.' }
  ],
  'flow-free': [
    { icon: '🔵', text: 'Drag between matching dots to connect each color.' },
    { icon: '🧩', text: 'Fill every cell without crossing lines.' },
    { icon: '🏁', text: 'First to fill the grid wins.' }
  ],
  mancala: [
    { icon: '🫘', text: 'Pick a pit and sow its seeds one per pit around the board.' },
    { icon: '🎯', text: 'Land your last seed in your store for an extra turn; capture across from empties.' },
    { icon: '🏆', text: 'Most seeds in your store wins.' }
  ],
  reversi: [
    { icon: '⚫', text: 'Place a disc to flank a line of the rival’s discs.' },
    { icon: '🔄', text: 'Flanked discs flip to your color.' },
    { icon: '🏆', text: 'Own the most discs when the board fills.' }
  ],
  'golf-solitaire': [
    { icon: '🃏', text: 'Play a column card that’s one rank up or down from the waste.' },
    { icon: '♻️', text: 'Stuck? Draw a new card from the stock.' },
    { icon: '🏆', text: 'Clear the most columns to beat the bot.' }
  ],
  'sudoku-mini': [
    { icon: '🔢', text: 'Fill the 6×6 grid with numbers 1–6.' },
    { icon: '🚫', text: 'No repeats in any row, column, or box.' },
    { icon: '🏁', text: 'Race the bot to solve it first.' }
  ],
  'knife-hit': [
    { icon: '🔪', text: 'Tap to throw a knife into the spinning log.' },
    { icon: '⚠️', text: 'Don’t hit a knife that’s already stuck!' },
    { icon: '⭐', text: 'Land every knife to score the most.' }
  ],
  'flood-it': [
    { icon: '🎨', text: 'Pick a color to flood from the top-left corner.' },
    { icon: '🌊', text: 'The matching region grows with each pick.' },
    { icon: '🏁', text: 'First to turn the whole board one color wins.' }
  ],
  nonogram: [
    { icon: '🔢', text: 'Use the row & column number clues to find filled cells.' },
    { icon: '✏️', text: 'Tap to fill, mark blanks to stay organized.' },
    { icon: '🏁', text: 'Reveal the hidden picture before the bot.' }
  ],
  'peg-solitaire': [
    { icon: '⚪', text: 'Jump a peg over a neighbor into an empty hole.' },
    { icon: '➖', text: 'The jumped peg is removed.' },
    { icon: '🏆', text: 'Leave as few pegs as possible — ideally one.' }
  ],
  battleship: [
    { icon: '🎯', text: 'Tap enemy waters to fire a shot.' },
    { icon: '💥', text: 'Hits reveal a ship; sink it by hitting every cell.' },
    { icon: '🏆', text: 'Sink the whole fleet before they sink yours.' }
  ],
  'simon-says': [
    { icon: '👀', text: 'Watch the pads flash in sequence.' },
    { icon: '🔁', text: 'Repeat the pattern by tapping them in order.' },
    { icon: '⭐', text: 'Each round adds a step — go as far as you can.' }
  ],
  'whack-a-mole': [
    { icon: '🐹', text: 'Tap the moles as they pop up.' },
    { icon: '💣', text: 'Avoid the bombs — they cost you points.' },
    { icon: '⭐', text: 'Most points in 30 seconds wins.' }
  ],
  blockudoku: [
    { icon: '🧩', text: 'Drag pieces onto the 9×9 grid.' },
    { icon: '✨', text: 'Complete a row, column, or 3×3 box to clear it.' },
    { icon: '⭐', text: 'Chain clears for combos and a higher score.' }
  ],
  minesweeper: [
    { icon: '🔢', text: 'Tap to reveal cells; numbers show nearby mines.' },
    { icon: '🚩', text: 'Flag the cells you think hide a mine.' },
    { icon: '🏁', text: 'Clear all safe cells before the bot — don’t hit a mine.' }
  ],
  'mahjong-mini': [
    { icon: '🀄', text: 'Match two identical tiles that are free on a side.' },
    { icon: '🧱', text: 'Removing tiles frees the ones beneath.' },
    { icon: '🏆', text: 'Clear the most pairs to win.' }
  ],
  'goods-match': [
    { icon: '📦', text: 'Tap items to move them into the tray.' },
    { icon: '✨', text: 'Three of a kind in the tray clear away.' },
    { icon: '⚠️', text: 'Don’t let the tray overflow!' }
  ],
  'hexa-sort': [
    { icon: '⬡', text: 'Drop color stacks onto the hex grid.' },
    { icon: '🔄', text: 'Matching neighbors merge together.' },
    { icon: '⭐', text: 'Full stacks pop for points.' }
  ],
  'screw-jam': [
    { icon: '🔩', text: 'Tap a screw to send it to a matching color box.' },
    { icon: '📦', text: 'Fill a box with three screws to clear it.' },
    { icon: '⭐', text: 'Unscrew everything without getting jammed.' }
  ],
  'helix-jump': [
    { icon: '🌀', text: 'Drag to spin the tower.' },
    { icon: '⬇️', text: 'Line up the gaps so the ball falls through.' },
    { icon: '⚠️', text: 'Avoid the colored danger zones — how deep can you go?' }
  ],
  'eat-grow': [
    { icon: '🕳️', text: 'Drag the hole around the map.' },
    { icon: '🍽️', text: 'Swallow anything smaller than you to grow.' },
    { icon: '⭐', text: 'Devour the most in 40 seconds.' }
  ],
  'brick-breaker': [
    { icon: '🎯', text: 'Aim and fire your stream of balls.' },
    { icon: '🧱', text: 'Hit the numbered blocks until they break.' },
    { icon: '⚠️', text: 'Stop them reaching the bottom — rack up the score.' }
  ],
  'tower-war': [
    { icon: '🏰', text: 'Towers grow troops over time.' },
    { icon: '👆', text: 'Drag between towers to send half your troops to attack.' },
    { icon: '🏆', text: 'Capture every tower to win.' }
  ],
  'unblock-me': [
    { icon: '🧱', text: 'Slide the wooden blocks aside.' },
    { icon: '🔑', text: 'Clear a path for the key block to the exit.' },
    { icon: '⭐', text: 'Fewer moves means a higher score.' }
  ],
  'liquid-lab': [
    { icon: '🧪', text: 'Pour liquids between test tubes.' },
    { icon: '💧', text: 'Only pour onto a matching color.' },
    { icon: '🏆', text: 'Sort every tube faster than the bot.' }
  ],
  'tile-match': [
    { icon: '🀄', text: 'Tap free tiles to send them to your rack.' },
    { icon: '✨', text: 'Three of a kind clear automatically.' },
    { icon: '⚠️', text: 'Collect three of a kind before time runs out.' }
  ],
  'word-wipe': [
    { icon: '🔤', text: 'Swipe across touching letters to spell words.' },
    { icon: '🌊', text: 'Used letters vanish and the grid collapses.' },
    { icon: '⭐', text: 'Most points in 75 seconds wins.' }
  ],
  checkers: [
    { icon: '⚫', text: 'Move diagonally; jump a rival piece to capture it.' },
    { icon: '👑', text: 'Reach the far row to crown a king (moves both ways).' },
    { icon: '🏆', text: 'Capture all their pieces to win.' }
  ],
  'hexa-puzzle': [
    { icon: '⬡', text: 'Drop hexagon pieces onto the board.' },
    { icon: '✨', text: 'Fill a full line on any of the three axes to clear it.' },
    { icon: '⭐', text: 'Keep space free and chase a high score.' }
  ],
  'merge-defense': [
    { icon: '🔢', text: 'Fire number tiles up the lanes.' },
    { icon: '🔀', text: 'Merge matching tiles to power them up.' },
    { icon: '🛡️', text: 'Wipe out enemies before they reach your base.' }
  ],
  'neon-tunnel': [
    { icon: '🚀', text: 'Steer your ship left and right.' },
    { icon: '⚠️', text: 'Dodge the obstacles in the tunnel.' },
    { icon: '⭐', text: 'Survive as long as you can.' }
  ],
  'stack-jump': [
    { icon: '👆', text: 'Tap to drop each sliding block.' },
    { icon: '🎯', text: 'Line it up perfectly — overhang gets trimmed off.' },
    { icon: '🏗️', text: 'Build the tallest tower you can.' }
  ],
  'arrow-escape': [
    { icon: '➡️', text: 'Tap a glowing arrow to launch it.' },
    { icon: '🚧', text: 'Its path to the edge must be clear.' },
    { icon: '🏁', text: 'First to empty the board wins.' }
  ],
  'black-hole-solitaire': [
    { icon: '🃏', text: 'Play any card one rank up or down from the black hole.' },
    { icon: '🕳️', text: 'Suits don’t matter — just rank.' },
    { icon: '🏆', text: 'Swallow the whole table to win.' }
  ],
  'dungeon-sweeper': [
    { icon: '🔢', text: 'Numbers hint at the danger around each tile.' },
    { icon: '⚔️', text: 'Grab loot, avoid monsters stronger than you.' },
    { icon: '🚪', text: 'Reach the exit before your HP runs out.' }
  ],
  'magnetic-pull': [
    { icon: '🧲', text: 'Hold the magnets to pull the steel ball.' },
    { icon: '↔️', text: 'Steer it down a tightening corridor.' },
    { icon: '⭐', text: 'Roll as far as you can.' }
  ],
  'perfect-slice': [
    { icon: '🔪', text: 'Drag to draw a straight cut across the shape.' },
    { icon: '⚖️', text: 'Split it into equal pieces.' },
    { icon: '🎯', text: 'Do it within the slice limit.' }
  ],
  'word-ladder': [
    { icon: '🔤', text: 'Change one letter at a time to make a new real word.' },
    { icon: '🪜', text: 'Climb from the start word to the goal word.' },
    { icon: '🏁', text: 'First to reach the goal wins.' }
  ],
  chess: [
    { icon: '♟️', text: 'Each piece moves its own way; capture by landing on a piece.' },
    { icon: '♚', text: 'Put the king in check — and inescapable check is mate.' },
    { icon: '🏆', text: 'Checkmate your opponent to win.' }
  ],
  'flappy-bird': [
    { icon: '👆', text: 'Tap to flap upward.' },
    { icon: '🟩', text: 'Fly through the gaps between pipes.' },
    { icon: '⚠️', text: 'One touch ends it — how far can you fly?' }
  ],
  hangman: [
    { icon: '🔤', text: 'Guess letters one at a time.' },
    { icon: '❌', text: 'Each wrong guess adds to the figure.' },
    { icon: '🏁', text: 'Reveal the word before it’s complete.' }
  ],
  klondike: [
    { icon: '🃏', text: 'Build the tableau down in alternating colors.' },
    { icon: '🔼', text: 'Send cards to the foundations Ace → King by suit.' },
    { icon: '🏆', text: 'Clear the most cards to beat the bot.' }
  ],
  'lights-out': [
    { icon: '💡', text: 'Tap a light to toggle it and its neighbours.' },
    { icon: '🧩', text: 'Work out the order to switch them all off.' },
    { icon: '🏁', text: 'Darken the whole grid before the bot.' }
  ],
  'fib-2048': [
    { icon: '↔️', text: 'Swipe to slide the tiles.' },
    { icon: '🔢', text: 'Merge consecutive Fibonacci numbers (1+1, 2+3, 5+8…).' },
    { icon: '🏆', text: 'Chase the highest tile and best the bot.' }
  ],
  sokoban: [
    { icon: '📦', text: 'Push crates onto the target tiles.' },
    { icon: '⚠️', text: 'You can only push — don’t wedge one in a corner.' },
    { icon: '🏁', text: 'First to tidy every crate wins.' }
  ],
  'bird-sort': [
    { icon: '🐦', text: 'Move birds between branches.' },
    { icon: '🎨', text: 'A bird only lands by a matching color (or empty branch).' },
    { icon: '🏆', text: 'Sort each branch into one flock.' }
  ],
  'connect-four': [
    { icon: '🔴', text: 'Drop a disc into a column.' },
    { icon: '📏', text: 'Line up four — across, down, or diagonally.' },
    { icon: '🏆', text: 'First to connect four wins.' }
  ],
  snake: [
    { icon: '🎮', text: 'Swipe or use arrows to steer the snake.' },
    { icon: '🍎', text: 'Eat food to grow longer.' },
    { icon: '⚠️', text: 'Don’t hit the walls or your own tail.' }
  ],
  'word-link': [
    { icon: '🔤', text: 'Tap letters on the wheel to spell words.' },
    { icon: '🎯', text: 'Find every hidden word in the grid.' },
    { icon: '🏆', text: 'Clear them all before the bot.' }
  ],
  'pyramid-solitaire': [
    { icon: '🃏', text: 'Pair exposed cards that add up to 13.' },
    { icon: '👑', text: 'Kings are worth 13 and clear on their own.' },
    { icon: '🏆', text: 'Dismantle the whole pyramid.' }
  ],
  dominoes: [
    { icon: '🁫', text: 'Match a tile’s number to an open end of the line.' },
    { icon: '🔄', text: 'No match? Draw from the boneyard.' },
    { icon: '🏁', text: 'First to empty their hand wins.' }
  ],
  'sliding-puzzle': [
    { icon: '🔢', text: 'Tap a tile next to the gap to slide it.' },
    { icon: '🧩', text: 'Shuffle the tiles into numerical order.' },
    { icon: '🏁', text: 'First to solve the puzzle wins.' }
  ]
};
