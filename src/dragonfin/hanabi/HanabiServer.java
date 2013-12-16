package dragonfin.hanabi;

import java.util.*;

public class HanabiServer
{
	Map<String,HanabiUser> usersByName = new HashMap<String,HanabiUser>();
	Map<String,HanabiUser> sessions = new HashMap<String,HanabiUser>();
	Map<String,HanabiGame> games = new HashMap<String,HanabiGame>();

	int nextSessionId = 1;

	HanabiServer()
	{
		usersByName.put("Jason", new HanabiUser("Jason"));
		usersByName.put("Dana", new HanabiUser("Dana"));
		usersByName.put("Bob", new HanabiUser("Bob"));
		usersByName.put("Sarah", new HanabiUser("Sarah"));

		HanabiGame g = new HanabiGame();
		g.addPlayer(usersByName.get("Jason"));
		g.addPlayer(usersByName.get("Dana"));
		g.addPlayer(usersByName.get("Bob"));
		g.addPlayer(usersByName.get("Sarah"));
		g.startGame();

		games.put("1", g);
	}

	public HanabiGame getGame(String gameId)
	{
		return games.get(gameId);
	}

	public HanabiUser getUserBySession(String sid)
	{
		return sessions.get(sid);
	}

	public String newSession(String userName)
	{
		HanabiUser u = usersByName.get(userName);
		if (u == null) {
			u = new HanabiUser(userName);
			usersByName.put(userName, u);
		}

		String sid = "s"+(nextSessionId++);
		sessions.put(sid, u);
		return sid;
	}
}
