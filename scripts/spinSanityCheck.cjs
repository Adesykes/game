/*
 Quick Round 3 spin sanity check
 - Creates a room as host, joins a second player, force starts the game
 - Jumps to round 3, triggers start-spin
 - Verifies that 'category-selected' arrives with a server-provided 'deadline'
 Run with: node scripts/spinSanityCheck.cjs
*/

const { io } = require('socket.io-client');

const SERVER = process.env.SERVER_URL || 'http://localhost:3002';

function waitFor(socket, event, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timeout waiting for ${event}`));
    }, timeoutMs);
    function onEvent(data) {
      clearTimeout(t);
      resolve(data);
    }
    socket.once(event, onEvent);
  });
}

async function main() {
  console.log(`[sanity] Connecting host to ${SERVER}`);
  const host = io(SERVER, { auth: { persistentId: 'host-test' }, transports: ['websocket','polling'] });
  await new Promise(res => host.on('server-handshake', res));
  console.log('[sanity] Host connected');

  const roomData = await new Promise((resolve, reject) => {
    host.emit('create-room', 'Host', (resp) => {
      if (!resp || !resp.success) return reject(new Error('create-room failed'));
      resolve(resp);
    });
  });
  const roomCode = roomData.roomCode;
  const hostId = roomData.gameState.players[0].id;
  console.log(`[sanity] Created room ${roomCode} host=${hostId}`);

  console.log('[sanity] Connecting player2');
  const p2 = io(SERVER, { auth: { persistentId: 'p2-test' }, transports: ['websocket','polling'] });
  await new Promise(res => p2.on('server-handshake', res));
  const joinResp = await new Promise((resolve, reject) => {
    p2.emit('join-room', roomCode, 'P2', (resp) => {
      if (!resp || !resp.success) return reject(new Error('join-room failed'));
      resolve(resp);
    });
  });
  const p2Id = joinResp.playerId;
  console.log(`[sanity] P2 joined as ${p2Id}`);

  // Start game then force start to skip ready_check
  host.emit('start-game', roomCode);
  await new Promise(r => setTimeout(r, 400));
  host.emit('host-force-start', roomCode, hostId);
  console.log('[sanity] Forced game start');
  await new Promise(r => setTimeout(r, 400));

  // Jump to round 3 for spin flow
  host.emit('host-set-round', roomCode, hostId, 3);
  console.log('[sanity] Set round to 3');
  await new Promise(r => setTimeout(r, 400));

  // Trigger spin
  const spinPromise = waitFor(host, 'spin-result', 7000);
  host.emit('start-spin', roomCode);
  const spin = await spinPromise;
  console.log(`[sanity] spin-result:`, spin);

  // Expect category-selected with deadline
  const catSel = await waitFor(host, 'category-selected', 10000);
  const { category, question, deadline, gameState } = catSel || {};
  if (!deadline || typeof deadline !== 'number') {
    throw new Error('category-selected missing server deadline');
  }
  const msLeft = deadline - Date.now();
  console.log(`[sanity] category-selected category=${category} questionId=${question?.id} deadlineInMs~${msLeft}`);
  if (msLeft < 5000 || msLeft > 21000) {
    console.warn('[sanity] Warning: deadline window looks unexpected.');
  }

  console.log('[sanity] SUCCESS: Round 3 spin flow emitted deadline.');
  host.close();
  p2.close();
}

main().catch(err => { console.error('[sanity] FAILED:', err); process.exit(1); });
