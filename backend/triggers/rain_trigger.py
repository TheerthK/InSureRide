import random

class RainTrigger:
    def check(self, zone):
        rainfall = random.uniform(0, 100)

        if rainfall > 64.5:
            return {
                "type": "RAIN",
                "zone": zone,
                "value": rainfall
            }
        return None

    def payout(self, rider):
        return 600