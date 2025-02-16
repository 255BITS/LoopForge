# Color and formatting functions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_status() {
    echo -e "\n${BOLD}${BLUE}=====================================${NC}"
    echo -e "${BOLD}${BLUE}>>> $1${NC}"
    echo -e "${BOLD}${BLUE}=====================================${NC}\n"
}

log_error() {
    echo -e "\n${BOLD}${RED}!!! ERROR: $1 !!!${NC}\n"
}

log_success() {
    echo -e "\n${BOLD}${GREEN}✓ SUCCESS: $1 ✓${NC}\n"
}

log_warning() {
    echo -e "\n${BOLD}${YELLOW}⚠ WARNING: $1 ⚠${NC}\n"
}

run_pytest() {
  python3 -m pytest "$@" --collect-only --disable-warnings
  local ret=$?
  # Replace 5 with the actual problematic exit code.
  [ $ret -eq 5 ] && ret=0
  return $ret
}

# Initialize the development cycle
log_status "Starting New Development Cycle"
INSTRUCTIONS="The goal is to create an index.html incremental rpg that can be played in the browser."
echo "NEW PROJECT" > next_feature.txt

while true; do
    FEATURE_ID=$(date +%s)
    log_status "Beginning Feature ${FEATURE_ID}"
    
    # Feature Planning Phase
    while [ -f "next_feature.txt" ]; do
        log_status "Planning Feature ${FEATURE_ID}"
        gptdiff "${INSTRUCTIONS}. analyze game state and write specific requirements for next feature into requirements_${FEATURE_ID}.txt" --apply --prepend https://getaiceo.com/agent/e9798c8b-ecb5-477f-b8bf-029adba9781e/export_url
        if [ -f "requirements_${FEATURE_ID}.txt" ]; then
            log_success "Requirements Generated"
            rm next_feature.txt
        fi
        sleep 2
    done

    # Test Creation Phase
    while [ -f "requirements_${FEATURE_ID}.txt" ]; do
        log_status "Creating Tests for Feature ${FEATURE_ID}"
        gptdiff "${INSTRUCTIONS}. Create pytest tests for the requirements in requirements_${FEATURE_ID}.txt in test_feature_${FEATURE_ID}.py. Tests must include assertions and cover both success and failure cases" --apply --model o3-mini
        
        if [ -f "test_feature_${FEATURE_ID}.py" ]; then
            # Validate test structure
            if ! run_pytest test_feature_${FEATURE_ID}.py; then
                log_error "Invalid Test Syntax - Regenerating"
                rm test_feature_${FEATURE_ID}.py
                continue
            fi
            
            # Check for assertions
            if ! grep -q "assert" test_feature_${FEATURE_ID}.py; then
                log_error "No Assertions Found - Regenerating Tests"
                rm test_feature_${FEATURE_ID}.py
                continue
            fi
            
            # Ensure test actually fails
            TEST_OUTPUT=$(pytest test_feature_${FEATURE_ID}.py -v 2>&1)
            if ! echo "$TEST_OUTPUT" | grep -q "FAILED"; then
                log_warning "Tests Pass Without Implementation - Invalid Tests"
                echo -e "${YELLOW}${TEST_OUTPUT}${NC}"
                rm test_feature_${FEATURE_ID}.py
                continue
            fi
            
            log_success "Valid Tests Created"
            rm requirements_${FEATURE_ID}.txt
        fi
        sleep 2
    done

    # Implementation Phase
    while [ -f "test_feature_${FEATURE_ID}.py" ] && ! pytest test_feature_${FEATURE_ID}.py; do
        log_status "Implementing Feature ${FEATURE_ID}"
        if ! run_pytest test_feature_${FEATURE_ID}.py; then
            log_error "Tests Became Invalid During Implementation"
            rm test_feature_${FEATURE_ID}.py
            echo "TODO" > next_feature.txt
            break
        fi
        
        # Capture and display test output
        TEST_OUTPUT=$(pytest test_feature_${FEATURE_ID}.py -v 2>&1)
        log_status "Current Test Failures:"
        echo -e "${YELLOW}${TEST_OUTPUT}${NC}"
        
        gptdiff "${INSTRUCTIONS}. Implement the feature for game.py to match the requirements and pass the tests in test_feature_${FEATURE_ID}.py. Here are the current test failures: ${TEST_OUTPUT}" --apply --model o3-mini
        sleep 2
    done
    log_status "Improving UI"
    gptdiff "${INSTRUCTIONS}. Make the functionality thats there look good. Do not add new functionality." --apply --prepend https://getaiceo.com/agent/e9798c8b-ecb5-477f-b8bf-029adba9781e/export_url

    # Log completion
    log_success "Feature ${FEATURE_ID} Completed Successfully"
    echo -e "${CYAN}$(date): Feature ${FEATURE_ID} completed${NC}" >> feature_history.log
    
    log_status "Starting Next Feature Cycle"
    echo "TODO" > next_feature.txt
    rm requirement*.txt
    sleep 5
done
