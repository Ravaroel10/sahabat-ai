"""
Eligibility calculation tool — ported from the Next.js eligibility-calculator.ts.

This is an INTERNAL orchestrator tool for chat context only. It is NOT exposed
as an API endpoint. The Next.js marketplace keeps its own TypeScript
eligibility-calculator.ts and computes synchronously. Both interpret the same
requirements data shape.

This tool is independent: it does not import other tools or the orchestrator.
"""

from typing import Any, Dict, List, Optional


def calculate_eligibility(
    program: Dict[str, Any], criteria: Dict[str, Any]
) -> Dict[str, Any]:
    """Calculate eligibility for a single program against user criteria.

    Args:
        program: Program dict with a 'requirements' field matching the
                 SocialProgram requirements shape:
                 {maxIncome, minAge, maxAge, hasChildren, minChildren,
                  hasDisability, isPregnant, occupation[]}
        criteria: User criteria dict with optional fields:
                  {income, age, hasChildren, childrenCount, hasDisability,
                   isPregnant, occupation}

    Returns:
        Dict with: status, matchedRequirements, unmatchedRequirements,
        missingInformation, gapAnalysis
    """
    requirements = program.get("requirements", {})
    matched: List[str] = []
    unmatched: List[str] = []
    missing: List[str] = []
    gap_analysis: Optional[Dict[str, Any]] = None

    # Income check
    max_income = requirements.get("maxIncome")
    if max_income is not None:
        if criteria.get("income") is None:
            missing.append("Penghasilan per bulan")
        elif criteria["income"] <= max_income:
            matched.append(f"Penghasilan ≤ Rp {max_income:,}")
        else:
            unmatched.append(f"Penghasilan ≤ Rp {max_income:,}")
            gap_analysis = {
                "field": "Penghasilan",
                "currentValue": criteria["income"],
                "requiredValue": max_income,
                "difference": criteria["income"] - max_income,
            }

    # Age check
    min_age = requirements.get("minAge")
    max_age = requirements.get("maxAge")
    if min_age is not None or max_age is not None:
        if criteria.get("age") is None:
            missing.append("Usia")
        else:
            age_ok = True
            if min_age is not None and criteria["age"] < min_age:
                age_ok = False
                unmatched.append(f"Usia minimal {min_age} tahun")
            if max_age is not None and criteria["age"] > max_age:
                age_ok = False
                unmatched.append(f"Usia maksimal {max_age} tahun")
            if age_ok:
                if min_age and max_age:
                    matched.append(f"Usia {min_age}-{max_age} tahun")
                elif min_age:
                    matched.append(f"Usia ≥ {min_age} tahun")
                elif max_age:
                    matched.append(f"Usia ≤ {max_age} tahun")

    # Children check
    has_children_req = requirements.get("hasChildren")
    if has_children_req is not None:
        if criteria.get("hasChildren") is None:
            missing.append("Status memiliki anak")
        elif criteria["hasChildren"] == has_children_req:
            matched.append(
                "Memiliki anak" if has_children_req else "Tidak memiliki anak"
            )
            min_children = requirements.get("minChildren")
            if min_children is not None and criteria["hasChildren"]:
                if criteria.get("childrenCount") is None:
                    missing.append("Jumlah anak")
                elif criteria["childrenCount"] >= min_children:
                    matched.append(f"Minimal {min_children} anak")
                else:
                    unmatched.append(f"Minimal {min_children} anak")
        else:
            unmatched.append(
                "Harus memiliki anak" if has_children_req else "Tidak boleh memiliki anak"
            )

    # Disability check
    has_disability_req = requirements.get("hasDisability")
    if has_disability_req is not None:
        if criteria.get("hasDisability") is None:
            missing.append("Status disabilitas")
        elif criteria["hasDisability"] == has_disability_req:
            matched.append(
                "Ada anggota keluarga dengan disabilitas"
                if has_disability_req
                else "Tidak ada disabilitas"
            )
        else:
            unmatched.append(
                "Harus memiliki anggota keluarga dengan disabilitas"
                if has_disability_req
                else "Program untuk non-disabilitas"
            )

    # Pregnancy check
    is_pregnant_req = requirements.get("isPregnant")
    if is_pregnant_req is not None:
        if criteria.get("isPregnant") is None:
            missing.append("Status kehamilan")
        elif criteria["isPregnant"] == is_pregnant_req:
            matched.append("Ibu hamil" if is_pregnant_req else "Tidak hamil")
        else:
            unmatched.append(
                "Hanya untuk ibu hamil" if is_pregnant_req else "Tidak untuk ibu hamil"
            )

    # Occupation check
    occupation_req = requirements.get("occupation")
    if occupation_req and len(occupation_req) > 0:
        if not criteria.get("occupation"):
            missing.append("Pekerjaan")
        elif criteria["occupation"] in occupation_req:
            matched.append(f"Pekerjaan: {criteria['occupation']}")
        else:
            unmatched.append(f"Pekerjaan harus: {', '.join(occupation_req)}")

    # Determine overall status
    if unmatched:
        status = "ineligible"
    elif missing:
        status = "partial"
    else:
        status = "eligible"

    return {
        "status": status,
        "matchedRequirements": matched,
        "unmatchedRequirements": unmatched,
        "missingInformation": missing,
        "gapAnalysis": gap_analysis,
    }


def calculate_all_eligibilities(
    programs: List[Dict[str, Any]], criteria: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Calculate eligibility for all programs and sort by status.

    Returns list of {program, eligibility} dicts sorted:
    eligible first, then partial, then ineligible.
    """
    status_order = {"eligible": 0, "partial": 1, "ineligible": 2}
    results = [
        {"program": p, "eligibility": calculate_eligibility(p, criteria)}
        for p in programs
    ]
    results.sort(key=lambda r: status_order[r["eligibility"]["status"]])
    return results
