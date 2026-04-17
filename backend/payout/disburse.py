def disburse(claim):
    print(f"💸 Paying ₹{claim.amount} to rider {claim.rider_id}")
    claim.status = "PAID"