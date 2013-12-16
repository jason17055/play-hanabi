package dragonfin.hanabi;

import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import com.fasterxml.jackson.core.*;

public class LoginServlet extends HttpServlet
{
	public void doPost(HttpServletRequest req, HttpServletResponse resp)
		throws IOException, ServletException
	{
		String userName = req.getParameter("name");
		JsonGenerator out = new JsonFactory().createJsonGenerator(
				resp.getOutputStream()
				);

		out.writeStartObject();
		out.writeStringField("sid", "foo");
		out.writeEndObject();
		out.close();
	}
}
