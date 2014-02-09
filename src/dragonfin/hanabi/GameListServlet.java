package dragonfin.hanabi;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import com.fasterxml.jackson.core.*;

public class GameListServlet extends HttpServlet
{
	HanabiServer s;

	@Override
	public void init()
		throws ServletException
	{
		s = (HanabiServer) getServletContext().getAttribute("hanabi");
		if (s == null) {
			throw new ServletException("HanabiServer not available");
		}
	}

	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse resp)
		throws IOException, ServletException
	{
		String sid = req.getParameter("sid");

		HanabiUser user = s.getUserBySession(sid);

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);

		out.writeStartObject();
		out.writeFieldName("games");
		out.writeStartArray();

		for (HanabiGame g : s.games.values())
		{
			out.writeStartObject();
			out.writeStringField("id", g.gameId);
			out.writeStringField("name", g.gameName);
			out.writeStringField("status",
				g.started ? "started" : "open"
				);
			out.writeNumberField("playerCount",
				g.seats.size()
				);
			out.writeNumberField("maxPlayers", 5);
			out.writeFieldName("players");
			out.writeStartArray();

			boolean foundSelf = false;
			for (HanabiGame.Seat seat : g.seats)
			{
				out.writeStartObject();
				if (seat.user != null) {
					out.writeStringField("name", seat.user.name);
				} else {
					out.writeStringField("name", "empty");
				}
				if (seat.user == g.owner) {
					out.writeBooleanField("owner", true);
				}
				if (seat.user == user) {
					foundSelf = true;
				}
				out.writeEndObject();
			}
			out.writeEndArray(); //players

			if (foundSelf) {
				out.writeBooleanField("canRejoin", true);
			}
			else {
				out.writeBooleanField("canJoin", true);
				out.writeBooleanField("canWatch", true);
			}

			out.writeEndObject();
		}

		out.writeEndArray();
		out.writeEndObject();
		out.close();
	}

	@Override
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
		throws IOException, ServletException
	{
		String sid = req.getParameter("sid");
		String action = req.getParameter("action");

		HanabiUser user = s.getUserBySession(sid);

		if (action.equals("create")) {

			HanabiGame g = new HanabiGame();
			g.gameName = req.getParameter("name");
			g.owner = user;
			g.addPlayer(user);

			s.addGame(g);

			JsonGenerator out = new JsonFactory().createJsonGenerator(
					resp.getOutputStream()
					);

			out.writeStartObject();
			out.writeStringField("gameId", g.gameId);
			out.writeEndObject();
			out.close();
		}
		else if (action.equals("join")) {

			String gameId = req.getParameter("table");
			HanabiGame g = s.getGame(gameId);
			g.addPlayer(user);

			JsonGenerator out = new JsonFactory().createJsonGenerator(
					resp.getOutputStream()
					);
			out.writeStartObject();
			out.writeStringField("status", "success");
			out.writeStringField("gameId", g.gameId);
			out.writeEndObject();
			out.close();
		}
		else if (action.equals("leave")) {

			String gameId = req.getParameter("table");
			HanabiGame g = s.getGame(gameId);
			g.removePlayer(user);

			JsonGenerator out = new JsonFactory().createJsonGenerator(
					resp.getOutputStream()
					);
			out.writeStartObject();
			out.writeStringField("status", "success");
			out.writeEndObject();
			out.close();
		}
	}
}
