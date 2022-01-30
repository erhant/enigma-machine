module.exports = {
  SetupType: {
    LetterCount: 1,
    InitialAlphabet: 2,
    InitialAlphabetWithRotors: 3,
  },
  Mode: {
    Double: 1, // Two machines in one. One for encryption other for decryption. Encryption will *not* affect the rotors used for decryption.
    Single: 2, // A single machine. Encryption will affect the rotors used for decryption.
  },
  UserTypes: {
    Honest: 1,
    Eavesdropper: 2,
  },
  DefaultRotors: [
    'SHBMFWEIQRODTAVXCPYZUJKGNL',
    'GYRFNUCZLQDWMKHSJOEPBVITXA',
    'MSEWGQHDPRFNXATOIBUJLCZVYK',
  ],
};
