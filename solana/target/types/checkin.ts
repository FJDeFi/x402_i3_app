/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/checkin.json`.
 */
export type Checkin = {
  "address": "HDNJ2F8CMHksj2EzuutDZiHrduCyi4KLZGabpdCs5BfZ",
  "metadata": {
    "name": "checkin",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "checkin",
      "docs": [
        "签到：更新最近一次 slot/时间与累计次数"
      ],
      "discriminator": [
        223,
        175,
        165,
        27,
        123,
        7,
        54,
        252
      ],
      "accounts": [
        {
          "name": "userPda",
          "docs": [
            "访问同一 PDA：用已存的 bump 进行校验"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeUser",
      "docs": [
        "初始化用户的 PDA 账户"
      ],
      "discriminator": [
        111,
        17,
        185,
        250,
        60,
        122,
        38,
        254
      ],
      "accounts": [
        {
          "name": "userPda",
          "docs": [
            "用户专属 PDA：种子 = [\"user\", authority]"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "userPda",
      "discriminator": [
        182,
        179,
        144,
        178,
        135,
        99,
        143,
        249
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAuthority",
      "msg": "Invalid authority for this user PDA"
    },
    {
      "code": 6001,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "userPda",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "lastCheckinSlot",
            "type": "u64"
          },
          {
            "name": "lastCheckinTs",
            "type": "i64"
          },
          {
            "name": "count",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
