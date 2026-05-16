/* MonWolf site config — public values only.
   Mirrors Chogi's pattern but namespaced as MonWolfConfig.
   ChogiConfig alias kept for files ported wholesale from Chogi.
*/
(function(){
  const CFG = {
    // ─── on-chain ────────────────────────────────────────────────
    CHAIN_HEX:   '0x8f',                          // Monad mainnet = 143
    RPC:         '',                              // proxied via /api/rpc
    EXPLORER:    'https://monadexplorer.com',
    TOKEN:       '0x8361a59d340466211ad4aB41C09a32e4530a7777',  // $MONWOLF
    DEAD:        '0x000000000000000000000000000000000000dEaD',

    // ─── MonWolf Trader Hub ───────────────────────────────────────
    // Gate: holders need ≥ 1M $MONWOLF to access (mirror Chogi's 1M $CHOGI)
    HUB_GATE_TOKENS:     1_000_000,

    // Treasury wallet receives swap fees if/when hub-router is deployed
    HUB_TREASURY:        '0xB9d4B73bE18914c6d64Bee65a806648370be467f',  // deployer for now
    HUB_FEE_BPS:         100,    // 1%
    HUB_ROUTER_ADDRESS:  '',     // not deployed yet

    // Wallets that bypass the 1M $MONWOLF hub gate (admin / treasury / dev)
    HUB_ADMIN_WALLETS: [
      '0xB9d4B73bE18914c6d64Bee65a806648370be467f',  // deployer / treasury
      '0x57C8A5AeC1c172fE41416A2FAE6eBDD92b552A16',  // platform
      '0x233C410944f4f02645988BF6341383Ec3Af4eC84'   // dev
    ],

    // nad.fun V3 mainnet contracts (shared across all Monad sites)
    NADFUN_LENS:                 '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea',
    NADFUN_BONDING_CURVE_ROUTER: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22',
    NADFUN_DEX_ROUTER:           '0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137',
    NADFUN_WMON:                 '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
    NADFUN_REF:                  ''
  };

  // Export under both names so files ported from Chogi work unchanged.
  window.MonWolfConfig = CFG;
  window.ChogiConfig   = CFG;  // alias — lets ported /js/* work without rename
})();
