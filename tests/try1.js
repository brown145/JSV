describe("Context", function() {
  
  it("have an api key", function() {
    expect(context.id).toEqual(jasmine.any(String));
  });
  
});