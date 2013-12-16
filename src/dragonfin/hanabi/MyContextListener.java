package dragonfin.hanabi;

import javax.servlet.*;
import javax.servlet.annotation.WebListener;

@WebListener()
public class MyContextListener implements ServletContextListener
{
	public void contextInitialized(ServletContextEvent evt)
	{
		ServletContext ctx = evt.getServletContext();
		ctx.setAttribute("hanabi", new HanabiServer());
	}

	public void contextDestroyed(ServletContextEvent evt)
	{
	}
}
