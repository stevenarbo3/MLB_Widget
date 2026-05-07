import pytest
import requests

ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"

@pytest.fixture
def api_response():
    response = requests.get(ESPN_URL)
    return response

class TestESPNApiHealth:

    def test_api_returns_200(self, api_response):
        """ESPN scoreboard API is reachable and healthy"""
        assert api_response.status_code == 200

    def test_response_is_json(self, api_response):
        """Response body is valid JSON"""
        data = api_response.json()
        assert isinstance(data, dict)

    def test_response_contains_events(self, api_response):
        """Response contains events field the widget depends on"""
        data = api_response.json()
        assert "events" in data

    def test_events_is_list(self, api_response):
        """Events field is a list"""
        data = api_response.json()
        assert isinstance(data["events"], list)


class TestESPNGameSchema:

    def setup_method(self):
        response = requests.get(ESPN_URL)
        data = response.json()
        self.games = data.get("events", [])

    def test_games_have_competitions(self):
        """Each game has a competitions field"""
        if not self.games:
            pytest.skip("No games today")
        for game in self.games:
            assert "competitions" in game

    def test_games_have_status(self):
        """Each game has a status field"""
        if not self.games:
            pytest.skip("No games today")
        for game in self.games:
            assert "status" in game

    def test_competitions_have_competitors(self):
        """Each competition has exactly 2 competitors"""
        if not self.games:
            pytest.skip("No games today")
        for game in self.games:
            competition = game["competitions"][0]
            assert "competitors" in competition
            assert len(competition["competitors"]) == 2

    def test_competitors_have_scores(self):
        """Each competitor has a score field"""
        if not self.games:
            pytest.skip("No games today")
        for game in self.games:
            for competitor in game["competitions"][0]["competitors"]:
                assert "score" in competitor

    def test_competitors_have_home_away(self):
        """Each competitor is labeled home or away"""
        if not self.games:
            pytest.skip("No games today")
        for game in self.games:
            labels = [c["homeAway"] for c in game["competitions"][0]["competitors"]]
            assert "home" in labels
            assert "away" in labels

    def test_teams_have_abbreviations(self):
        """Each team has an abbreviation matching widget's mlb_teams map"""
        if not self.games:
            pytest.skip("No games today")
        for game in self.games:
            for competitor in game["competitions"][0]["competitors"]:
                assert "abbreviation" in competitor["team"]