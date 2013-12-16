package dragonfin.hanabi;

import java.util.*;

public class HanabiServer
{
	Map<String,HanabiUser> usersByName = new HashMap<String,HanabiUser>();
	Map<String,HanabiUser> sessions = new HashMap<String,HanabiUser>();

	int nextSessionId = 1;

	public String newSession(String userName)
	{
		String sid = "s"+(nextSessionId++);
		HanabiUser u = new HanabiUser(userName);
		usersByName.put(userName, u);
		sessions.put(sid, u);
		return sid;
	}
}
