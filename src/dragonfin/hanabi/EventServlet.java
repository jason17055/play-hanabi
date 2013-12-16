package dragonfin.hanabi;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import com.fasterxml.jackson.core.*;

public class EventServlet extends HttpServlet
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
		String gameId = req.getParameter("game");
		String eventId = req.getParameter("event");
		HanabiGame game = s.getGame(gameId);

		HanabiEvent evt;
		try {
			evt = game.events.getEvent(Integer.parseInt(eventId));
		}
		catch (EventStream.EventNotFound e) {
			resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
			return;
		}

		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);
		out.writeStartObject();
		out.writeFieldName("event");
		evt.writeJson(out);
		out.writeFieldName("nextEvent");
		out.writeNumber(evt.id+1);
		out.writeEndObject();
		out.close();
	}
}
