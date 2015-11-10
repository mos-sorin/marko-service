TESTS = test/*.js
test:
	mocha  --timeout 5000 --reporter list $(TESTS)

.PHONY: test
