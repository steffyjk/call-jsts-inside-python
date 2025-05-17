const { IgApiClient } = require('instagram-private-api');
const { withRealtime, GraphQLSubscriptions, SkywalkerSubscriptions } = require('instagram_mqtt');

const ig = withRealtime(new IgApiClient());

async function login(username, password) {
  console.info("THIS IS DATA", username);
  console.info("THIS IS DATA", password);

  ig.state.generateDevice(username);

  try {
    await ig.simulate.preLoginFlow();
  } catch (err) {
    console.warn("⚠️ preLoginFlow warning (ignored):", err.message || err);
  }

  try {
    await ig.account.login(username, password);
  } catch (err) {
    console.error("❌ Login failed:", err.message || err);
    process.exit(1); // Exit if login fails
  }

  process.nextTick(async () => {
    try {
      await ig.simulate.postLoginFlow();
    } catch (err) {
      console.warn("⚠️ postLoginFlow warning (ignored):", err.message || err);
    }
  });

  return ig;
}

async function startRealtime(username, password) {
  const ig = await login(username, password);

  ig.realtime.on('receive', (topic, messages) => {
    console.log(JSON.stringify({ event: 'receive', topic, messages }));
  });
  ig.realtime.on('message', logEvent('messageWrapper'));
  ig.realtime.on('threadUpdate', logEvent('threadUpdateWrapper'));
  ig.realtime.on('direct', logEvent('direct'));
  ig.realtime.on('realtimeSub', logEvent('realtimeSub'));
  ig.realtime.on('error', (err) => {
    console.error('Realtime error:', err);
  });
  ig.realtime.on('close', () => {
    console.log(JSON.stringify({ event: 'closed' }));
  });

  await ig.realtime.connect({
    graphQlSubs: [
      GraphQLSubscriptions.getAppPresenceSubscription(),
      GraphQLSubscriptions.getZeroProvisionSubscription(ig.state.phoneId),
      GraphQLSubscriptions.getDirectStatusSubscription(),
      GraphQLSubscriptions.getDirectTypingSubscription(ig.state.cookieUserId),
      GraphQLSubscriptions.getAsyncAdSubscription(ig.state.cookieUserId),
    ],
    skywalkerSubs: [
      SkywalkerSubscriptions.directSub(ig.state.cookieUserId),
      SkywalkerSubscriptions.liveSub(ig.state.cookieUserId),
    ],
    irisData: await ig.feed.directInbox().request(),
    connectOverrides: {},
  });

  console.log('✅ Realtime connection established.');
}

function logEvent(name) {
  return (data) => {
    console.log(JSON.stringify({ event: name, data }));
  };
}

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error("Usage: node realtime.js <username> <password>");
  process.exit(1);
}

startRealtime(username, password).catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
