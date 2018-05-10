module.exports = {
  bridges: {
    mongoose: {
      application: {
        exampleMongoHandler: {
          connection_options: {
            host: '127.0.0.1',
            port: '27017',
            name: 'test'
          }
        }
      }
    }
  }
};
