.PHONY: test test-cov test-verbose test-one clean install install-dev build

# Run tests
test:
	pytest tests/ -v

# Run tests with coverage
test-cov:
	pytest tests/ --cov=src --cov-report=term-missing --cov-report=html

# Run tests with verbose output
test-verbose:
	pytest tests/ -vv

# Run specific test (usage: make test-one TEST=TestProfileParsing::test_software_engineer_profile)
test-one:
	pytest tests/test_profile_parsing.py::$(TEST) -v

# Clean up generated files
clean:
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	rm -rf build
	rm -rf dist
	rm -rf *.egg-info
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Install runtime dependencies
install:
	pip install -e .

# Install development dependencies
install-dev:
	pip install -e .
	pip install -r requirements-test.txt

# Build distribution package
build:
	python setup.py sdist bdist_wheel
