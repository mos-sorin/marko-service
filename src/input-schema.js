exports.Schema = {
    name : "Json Schema for validate the received input",
    type : "object",
    additionalProperties : false,
    required : ["fields", "template"],
    properties :
    {
      fields   : { type : "object", minProperties: 1},
      template : { type : "string" },
    }
  };
