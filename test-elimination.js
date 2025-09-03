// Create test room with 3 players
const testRoom = {
  gameState: {
    gamePhase: 'playing',
    players: [
      { id: 'p1', name: 'Player 1', lives: 3, isHost: true, isEliminated: false },
      { id: 'p2', name: 'Player 2', lives: 1, isHost: false, isEliminated: false },
      { id: 'p3', name: 'Player 3', lives: 1, isHost: false, isEliminated: false }
    ],
    currentPlayerIndex: 1
  }
};

// Define the functions being tested
function checkLastPlayerStanding(room) {
  const activePlayers = room.gameState.players.filter(p => !p.isEliminated);
  
  if (activePlayers.length === 1 && room.gameState.players.length > 1) {
    console.log(`Last player standing: ${activePlayers[0].name}`);
    return activePlayers[0];
  }
  
  return null;
}

function endGame(room, roomCode, winner) {
  console.log(`Game ending, winner: ${winner?.name || 'None'}`);
  room.gameState.gamePhase = 'finished';
  room.gameState.winner = winner;
  console.log('Final game state:', JSON.stringify(room.gameState, null, 2));
}

// Test cases
console.log('===== Initial state =====');
console.log(`Active players: ${testRoom.gameState.players.filter(p => !p.isEliminated).length}`);
console.log('Last player standing check result:', checkLastPlayerStanding(testRoom) ? 'Yes' : 'No');

console.log('\n===== Test: Eliminate one player =====');
testRoom.gameState.players[1].lives = 0;
testRoom.gameState.players[1].isEliminated = true;
console.log('Player 2 eliminated');
console.log(`Active players: ${testRoom.gameState.players.filter(p => !p.isEliminated).length}`);
console.log('Last player standing check result:', checkLastPlayerStanding(testRoom) ? 'Yes' : 'No');

console.log('\n===== Test: Eliminate second player (leaving only one) =====');
testRoom.gameState.players[2].lives = 0;
testRoom.gameState.players[2].isEliminated = true;
console.log('Player 3 eliminated');
console.log(`Active players: ${testRoom.gameState.players.filter(p => !p.isEliminated).length}`);

const lastPlayer = checkLastPlayerStanding(testRoom);
console.log('Last player standing check result:', lastPlayer ? lastPlayer.name : 'No');

if (lastPlayer) {
  console.log('\n===== Test: End game with winner =====');
  endGame(testRoom, 'TEST', lastPlayer);
}
