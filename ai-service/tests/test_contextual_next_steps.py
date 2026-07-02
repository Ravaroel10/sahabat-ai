"""
Unit tests for build_contextual_next_steps function.

Tests cover the requirements from improve-chat-response-ux spec:
1. Eligible program scenario - should generate "Ajukan [Program]" steps
2. Partial match scenario - should generate "Lengkapi informasi" steps
3. Emergency scenario - should prioritize safety actions like "Hubungi 119"
4. Multiple programs scenario - should order by eligibility
"""

import pytest
from api.chat import build_contextual_next_steps


class TestContextualNextSteps:
    """Test suite for contextual next steps generation."""

    def test_emergency_scenario_prioritizes_safety_actions(self):
        """
        Test: Emergency scenario should prioritize safety actions like "Hubungi 119"
        
        Requirements:
        - Emergency SHALL prioritize immediate safety actions
        - SHALL include "Hubungi 119" and UGD navigation
        - SHALL NOT include generic program browsing steps
        """
        programs = [
            {
                "id": "pkh",
                "name": "Program Keluarga Harapan",
                "eligibilityStatus": "eligible"
            }
        ]
        emergency = True
        user_message = "Anak saya sakit parah dan demam tinggi"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should return emergency steps
        assert len(steps) <= 3, "Emergency steps should be limited to 3"
        assert any("119" in step["text"] for step in steps), "Should include emergency hotline 119"
        assert any("UGD" in step["text"] or "ugd" in step["text"].lower() for step in steps), "Should include UGD navigation"
        
        # Should NOT include program application steps
        assert not any("Ajukan" in step["text"] for step in steps), "Should not include program application in emergency"
        
        # Check action types
        assert any(step["action"] == "emergency_call" for step in steps), "Should have emergency_call action"

    def test_eligible_program_generates_application_steps(self):
        """
        Test: Eligible program should generate "Ajukan [Program]" steps with document requirements
        
        Requirements:
        - SHALL include program-specific actions like "Ajukan [Program Name]"
        - SHALL reference the specific program by name
        - SHALL include document preparation steps
        """
        programs = [
            {
                "id": "pkh",
                "name": "Program Keluarga Harapan",
                "eligibilityStatus": "eligible"
            }
        ]
        emergency = False
        user_message = "Saya memiliki 3 anak dan penghasilan di bawah 2 juta per bulan"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should include application step with program name
        assert any("Ajukan" in step["text"] and "Program Keluarga Harapan" in step["text"] for step in steps), \
            "Should include application step with program name"
        
        # Should include document preparation step
        assert any("Siapkan dokumen" in step["text"] for step in steps), \
            "Should include document preparation step"
        assert any("KTP" in step["text"] for step in steps), \
            "Should include specific document names like KTP"
        
        # Check action types
        assert any(step["action"] == "apply" for step in steps), "Should have apply action"
        assert any(step["target"] == "pkh" for step in steps), "Should target the correct program ID"

    def test_partial_match_generates_information_gathering_steps(self):
        """
        Test: Partial match should generate "Lengkapi informasi" steps
        
        Requirements:
        - SHALL guide user to provide specific missing fields
        - SHALL explain why this information is needed (by mentioning the program)
        """
        programs = [
            {
                "id": "bpnt",
                "name": "Bantuan Pangan Non Tunai",
                "eligibilityStatus": "partial",
                "missingFields": ["penghasilan", "jumlah_tanggungan"]
            }
        ]
        emergency = False
        user_message = "Saya butuh bantuan pangan"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should include information gathering step
        assert any("Lengkapi informasi" in step["text"] for step in steps), \
            "Should include information gathering prompt"
        
        # Should mention the program name
        assert any("Bantuan Pangan Non Tunai" in step["text"] for step in steps), \
            "Should mention the program name in the step"
        
        # Should mention missing fields
        assert any("penghasilan" in step["text"] or "jumlah_tanggungan" in step["text"] for step in steps), \
            "Should mention specific missing fields"
        
        # Check action types
        assert any(step["action"] == "gather_info" for step in steps), "Should have gather_info action"

    def test_multiple_programs_ordered_by_eligibility(self):
        """
        Test: Multiple programs should be ordered by eligibility (eligible first, then partial, then ineligible)
        
        Requirements:
        - SHALL order steps by eligibility (eligible first, then partial, then ineligible)
        - Each step SHALL clearly indicate which program it relates to
        """
        programs = [
            {
                "id": "bpnt",
                "name": "Bantuan Pangan Non Tunai",
                "eligibilityStatus": "ineligible"
            },
            {
                "id": "pkh",
                "name": "Program Keluarga Harapan",
                "eligibilityStatus": "eligible"
            },
            {
                "id": "pip",
                "name": "Program Indonesia Pintar",
                "eligibilityStatus": "partial",
                "missingFields": ["usia_anak"]
            },
            {
                "id": "bsu",
                "name": "Bantuan Subsidi Upah",
                "eligibilityStatus": "eligible"
            }
        ]
        emergency = False
        user_message = "Saya butuh bantuan untuk keluarga saya"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should prioritize eligible programs first
        # Find index of first eligible program mention
        eligible_indices = [i for i, step in enumerate(steps) if "Program Keluarga Harapan" in step["text"] or "Bantuan Subsidi Upah" in step["text"]]
        partial_indices = [i for i, step in enumerate(steps) if "Program Indonesia Pintar" in step["text"]]
        
        if eligible_indices and partial_indices:
            assert min(eligible_indices) < min(partial_indices), \
                "Eligible program steps should come before partial match steps"
        
        # Should have apply actions for eligible programs
        apply_steps = [step for step in steps if step["action"] == "apply"]
        assert len(apply_steps) > 0, "Should have at least one apply action for eligible programs"
        
        # Check that eligible programs are mentioned
        assert any("Ajukan" in step["text"] for step in steps), \
            "Should include application steps for eligible programs"

    def test_no_eligible_programs_suggests_exploration(self):
        """
        Test: When no eligible or partial programs, should suggest exploring all programs
        
        Requirements:
        - SHALL include "Lihat semua program" when no eligible programs
        - SHALL suggest information gathering if user message is vague
        """
        programs = [
            {
                "id": "pkh",
                "name": "Program Keluarga Harapan",
                "eligibilityStatus": "ineligible"
            }
        ]
        emergency = False
        user_message = "Bantuan apa"  # Vague message (< 10 words)
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should suggest viewing all programs
        assert any("Lihat semua program" in step["text"] for step in steps), \
            "Should suggest viewing all programs when none are eligible"
        
        # Should suggest providing more information for vague queries
        assert any("situasi Anda" in step["text"] or "lebih detail" in step["text"] for step in steps), \
            "Should suggest providing more details for vague queries"
        
        # Check action types
        assert any(step["action"] == "view" for step in steps), "Should have view action"
        assert any(step["action"] == "gather_info" for step in steps), "Should have gather_info action"

    def test_steps_are_actionable_and_specific(self):
        """
        Test: Each step should be actionable and specific, not generic
        
        Requirements:
        - Each step SHALL be a concrete, actionable instruction
        - SHALL include specific document names (not generic "dokumen persyaratan")
        - SHALL include navigation targets when appropriate
        """
        programs = [
            {
                "id": "pkh",
                "name": "Program Keluarga Harapan",
                "eligibilityStatus": "eligible"
            }
        ]
        emergency = False
        user_message = "Saya ingin mendaftar PKH"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Each step should have required fields
        for step in steps:
            assert "text" in step, "Step should have 'text' field"
            assert "action" in step, "Step should have 'action' field"
            assert "target" in step, "Step should have 'target' field"
            assert len(step["text"]) > 0, "Step text should not be empty"
        
        # Document preparation should be specific
        doc_steps = [step for step in steps if "dokumen" in step["text"].lower()]
        if doc_steps:
            # Should mention specific documents, not generic
            assert any("KTP" in step["text"] or "Kartu Keluarga" in step["text"] for step in doc_steps), \
                "Document steps should list specific document names"

    def test_maximum_four_steps_returned(self):
        """
        Test: Should return maximum 4 steps for clarity
        
        Requirements:
        - SHALL return 2-4 specific steps (not more to avoid overwhelming user)
        """
        programs = [
            {
                "id": f"program-{i}",
                "name": f"Program {i}",
                "eligibilityStatus": "eligible"
            }
            for i in range(10)  # Many programs
        ]
        emergency = False
        user_message = "Saya butuh bantuan"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should not exceed 4 steps
        assert len(steps) <= 4, "Should return maximum 4 steps for clarity"
        assert len(steps) >= 2, "Should return at least 2 steps when programs are available"

    def test_steps_include_program_ids_for_navigation(self):
        """
        Test: Steps should include program IDs in target field for navigation
        
        Requirements:
        - SHALL include navigation target (e.g., program ID) in target field
        - SHALL be clickable/linkable if possible
        """
        programs = [
            {
                "id": "pkh-2024",
                "name": "Program Keluarga Harapan",
                "eligibilityStatus": "eligible"
            }
        ]
        emergency = False
        user_message = "Saya tertarik dengan PKH"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Steps should reference the program ID
        apply_steps = [step for step in steps if step["action"] == "apply"]
        if apply_steps:
            assert any(step["target"] == "pkh-2024" for step in apply_steps), \
                "Apply action should target the correct program ID"
        
        view_steps = [step for step in steps if step["action"] == "view"]
        if view_steps:
            assert all(step["target"] for step in view_steps), \
                "View actions should have targets"

    def test_eligible_and_partial_mix(self):
        """
        Test: Mix of eligible and partial programs should show both types of actions
        
        Requirements:
        - Should show apply actions for eligible programs
        - Should show gather_info actions for partial programs
        - Should prioritize eligible over partial
        """
        programs = [
            {
                "id": "pkh",
                "name": "Program Keluarga Harapan",
                "eligibilityStatus": "eligible"
            },
            {
                "id": "pip",
                "name": "Program Indonesia Pintar",
                "eligibilityStatus": "partial",
                "missingFields": ["usia_anak", "status_sekolah"]
            }
        ]
        emergency = False
        user_message = "Saya butuh bantuan untuk keluarga dan pendidikan anak"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should include both apply and gather_info actions
        actions = [step["action"] for step in steps]
        assert "apply" in actions, "Should have apply action for eligible program"
        assert "gather_info" in actions, "Should have gather_info action for partial program"
        
        # Eligible program (apply) should come before partial (gather_info)
        apply_index = next(i for i, step in enumerate(steps) if step["action"] == "apply")
        gather_index = next(i for i, step in enumerate(steps) if step["action"] == "gather_info")
        assert apply_index < gather_index, "Apply action should come before gather_info action"

    def test_empty_programs_list(self):
        """
        Test: Empty programs list should return generic exploration steps
        
        Requirements:
        - Should handle empty programs list gracefully
        - Should return at least some steps (not empty array)
        """
        programs = []
        emergency = False
        user_message = "Saya butuh bantuan"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should return steps even with no programs
        assert len(steps) > 0, "Should return steps even with empty programs list"
        
        # Should suggest viewing all programs
        assert any("Lihat semua program" in step["text"] for step in steps), \
            "Should suggest viewing all programs when list is empty"

    def test_partial_program_without_missing_fields(self):
        """
        Test: Partial program without missingFields should still generate gather_info step
        
        Requirements:
        - Should handle partial programs without missingFields array
        - Should generate generic information gathering prompt
        """
        programs = [
            {
                "id": "bpnt",
                "name": "Bantuan Pangan Non Tunai",
                "eligibilityStatus": "partial"
                # No missingFields
            }
        ]
        emergency = False
        user_message = "Saya butuh bantuan pangan"
        
        steps = build_contextual_next_steps(programs, emergency, user_message)
        
        # Should still include information gathering step
        assert any("Lengkapi informasi" in step["text"] for step in steps), \
            "Should include information gathering even without specific missing fields"
        
        # Should mention the program name
        assert any("Bantuan Pangan Non Tunai" in step["text"] for step in steps), \
            "Should mention the program name"


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])
