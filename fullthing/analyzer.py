import re
import json
from typing import List, Dict, Any
from dataclasses import dataclass
from enum import Enum

class IssueType(Enum):
    CONTRADICTION = "contradiction"
    AMBIGUITY = "ambiguity"
    JAILBREAK_RISK = "jailbreak_risk"
    EDGE_CASE = "edge_case"
    LOGICAL_INCONSISTENCY = "logical_inconsistency"

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class Issue:
    type: IssueType
    severity: Severity
    description: str
    location: str
    suggestion: str

class RuleExtractor:
    """Simulates Martyn's neurosymbolic engine for rule extraction"""
    
    def extract_rules(self, prompt: str) -> List[Dict[str, Any]]:
        rules = []
        
        # Extract explicit rules (simplified version)
        rule_patterns = [
            r"(?:must|should|always|never)\s+([^.!?]+)",
            r"(?:don't|do not|cannot|can't)\s+([^.!?]+)",
            r"(?:if|when|whenever)\s+([^,]+),?\s+(?:then\s+)?([^.!?]+)"
        ]
        
        for pattern in rule_patterns:
            matches = re.finditer(pattern, prompt, re.IGNORECASE)
            for match in matches:
                rules.append({
                    'text': match.group(0),
                    'type': 'explicit',
                    'components': match.groups()
                })
        
        return rules

class ContradictionChecker:
    """Simplified Prolog-style contradiction checking"""
    
    def check_contradictions(self, rules: List[Dict[str, Any]]) -> List[Issue]:
        issues = []
        
        # Check for direct contradictions
        for i, rule1 in enumerate(rules):
            for j, rule2 in enumerate(rules[i+1:], i+1):
                if self._are_contradictory(rule1, rule2):
                    issues.append(Issue(
                        type=IssueType.CONTRADICTION,
                        severity=Severity.HIGH,
                        description=f"Rules contradict each other: '{rule1['text']}' vs '{rule2['text']}'",
                        location=f"Rules at positions {i+1} and {j+1}",
                        suggestion="Reconcile these rules or add clarifying context"
                    ))
        
        return issues
    
    def _are_contradictory(self, rule1: Dict, rule2: Dict) -> bool:
        # Simplified contradiction detection
        text1 = rule1['text'].lower()
        text2 = rule2['text'].lower()
        
        # Check for opposite modals
        if ('must' in text1 and 'never' in text2) or ('never' in text1 and 'must' in text2):
            # Check if they refer to similar actions
            words1 = set(text1.split())
            words2 = set(text2.split())
            if len(words1.intersection(words2)) > 2:
                return True
        
        return False

class JailbreakDetector:
    """Simplified version of Mikkel's adversarial agent"""
    
    def detect_vulnerabilities(self, prompt: str) -> List[Issue]:
        issues = []
        
        # Check for common jailbreak patterns
        risky_patterns = [
            (r"ignore\s+(?:previous|prior|above)\s+instructions", "Direct instruction override vulnerability"),
            (r"pretend|roleplay|act\s+as", "Role manipulation vulnerability"),
            (r"forget\s+everything", "Memory reset vulnerability"),
            (r"new\s+(?:game|scenario|context)", "Context switching vulnerability")
        ]
        
        for pattern, description in risky_patterns:
            if re.search(pattern, prompt, re.IGNORECASE):
                issues.append(Issue(
                    type=IssueType.JAILBREAK_RISK,
                    severity=Severity.CRITICAL,
                    description=description,
                    location=f"Pattern '{pattern}' detected",
                    suggestion="Add explicit boundaries and rejection phrases for these attempts"
                ))
        
        # Check for missing safety instructions
        safety_keywords = ['ethical', 'harmful', 'illegal', 'safety', 'appropriate']
        if not any(keyword in prompt.lower() for keyword in safety_keywords):
            issues.append(Issue(
                type=IssueType.JAILBREAK_RISK,
                severity=Severity.MEDIUM,
                description="No explicit safety or ethical guidelines found",
                location="Overall prompt",
                suggestion="Add clear ethical boundaries and safety instructions"
            ))
        
        return issues

class PromptAnalyzer:
    def __init__(self):
        self.rule_extractor = RuleExtractor()
        self.contradiction_checker = ContradictionChecker()
        self.jailbreak_detector = JailbreakDetector()
    
    def analyze(self, prompt: str) -> Dict[str, Any]:
        issues = []
        
        # Extract rules
        rules = self.rule_extractor.extract_rules(prompt)
        
        # Check contradictions
        issues.extend(self.contradiction_checker.check_contradictions(rules))
        
        # Check jailbreak vulnerabilities
        issues.extend(self.jailbreak_detector.detect_vulnerabilities(prompt))
        
        return {
            'prompt_length': len(prompt),
            'rules_found': len(rules),
            'issues': [issue.__dict__ for issue in issues],
            'summary': self._generate_summary(issues)
        }
    
    def _generate_summary(self, issues: List[Issue]) -> str:
        if not issues:
            return "No issues detected. Your prompt appears well-structured."
        
        critical = sum(1 for i in issues if i.severity == Severity.CRITICAL)
        high = sum(1 for i in issues if i.severity == Severity.HIGH)
        
        return f"Found {len(issues)} issues ({critical} critical, {high} high severity)"
