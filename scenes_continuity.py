from manim import *

class GeneratedScene(Scene):
    def construct(self):
        # Title
        title = Text("Continuity at a Point", font_size=36, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Formula
        formula = MathTex(
            r"\forall \varepsilon > 0,\ \exists \delta > 0 :\ ",
            r"|x - c| < \delta",
            r"\ \Rightarrow\ ",
            r"|f(x) - f(c)| < \varepsilon",
            font_size=34
        )
        formula.next_to(title, DOWN, buff=0.4)
        self.play(Write(formula))
        self.wait(1)

        # Highlight epsilon part
        eps_part = formula[3]
        delta_part = formula[1]
        self.play(eps_part.animate.set_color(YELLOW))
        self.wait(0.5)
        self.play(delta_part.animate.set_color(GREEN))
        self.wait(0.5)

        # Axes
        axes = Axes(
            x_range=[-1, 5, 1],
            y_range=[-1, 5, 1],
            x_length=6,
            y_length=4.2,
            axis_config={"include_tip": True, "stroke_width": 2}
        ).to_edge(DOWN, buff=0.3).shift(LEFT*0.5)
        self.play(Create(axes))

        # Function f(x) = 0.3 x^2 + 0.5
        func = lambda x: 0.3 * x**2 + 0.5
        graph = axes.plot(func, x_range=[0, 4.2], color=BLUE)
        self.play(Create(graph))

        # Point c
        c_val = 2.5
        fc_val = func(c_val)
        c_dot = Dot(axes.c2p(c_val, fc_val), color=RED)
        c_label = MathTex("c", font_size=28, color=RED).next_to(axes.c2p(c_val, 0), DOWN, buff=0.1)
        fc_label = MathTex("f(c)", font_size=28, color=RED).next_to(axes.c2p(0, fc_val), LEFT, buff=0.1)
        self.play(FadeIn(c_dot), Write(c_label), Write(fc_label))
        self.wait(0.5)

        # Epsilon band on y-axis
        eps = 0.7
        eps_top = axes.c2p(0, fc_val + eps)
        eps_bot = axes.c2p(0, fc_val - eps)
        eps_top_r = axes.c2p(4.2, fc_val + eps)
        eps_bot_r = axes.c2p(4.2, fc_val - eps)
        eps_band = Polygon(eps_bot, eps_bot_r, eps_top_r, eps_top,
                           color=YELLOW, fill_opacity=0.2, stroke_width=0)
        eps_line_top = DashedLine(eps_top, eps_top_r, color=YELLOW, stroke_width=2)
        eps_line_bot = DashedLine(eps_bot, eps_bot_r, color=YELLOW, stroke_width=2)
        eps_brace = Brace(Line(eps_bot, eps_top), LEFT, color=YELLOW)
        eps_text = MathTex(r"2\varepsilon", color=YELLOW, font_size=28).next_to(eps_brace, LEFT, buff=0.1)

        self.play(FadeIn(eps_band), Create(eps_line_top), Create(eps_line_bot))
        self.play(GrowFromCenter(eps_brace), Write(eps_text))
        self.wait(0.5)

        # Find delta visually
        delta = 0.8
        d_left = axes.c2p(c_val - delta, 0)
        d_right = axes.c2p(c_val + delta, 0)
        d_left_top = axes.c2p(c_val - delta, 5)
        d_right_top = axes.c2p(c_val + delta, 5)
        delta_band = Polygon(d_left, d_right, d_right_top, d_left_top,
                             color=GREEN, fill_opacity=0.2, stroke_width=0)
        d_line_l = DashedLine(d_left, d_left_top, color=GREEN, stroke_width=2)
        d_line_r = DashedLine(d_right, d_right_top, color=GREEN, stroke_width=2)
        d_brace = Brace(Line(d_left, d_right), DOWN, color=GREEN)
        d_text = MathTex(r"2\delta", color=GREEN, font_size=28).next_to(d_brace, DOWN, buff=0.1)

        self.play(FadeIn(delta_band), Create(d_line_l), Create(d_line_r))
        self.play(GrowFromCenter(d_brace), Write(d_text))
        self.wait(1)

        # Moving point demonstrating implication
        x_tracker = ValueTracker(c_val - delta + 0.05)
        moving_dot = always_redraw(lambda: Dot(
            axes.c2p(x_tracker.get_value(), func(x_tracker.get_value())),
            color=WHITE
        ))
        v_line = always_redraw(lambda: DashedLine(
            axes.c2p(x_tracker.get_value(), 0),
            axes.c2p(x_tracker.get_value(), func(x_tracker.get_value())),
            color=WHITE, stroke_width=1.5
        ))
        h_line = always_redraw(lambda: DashedLine(
            axes.c2p(0, func(x_tracker.get_value())),
            axes.c2p(x_tracker.get_value(), func(x_tracker.get_value())),
            color=WHITE, stroke_width=1.5
        ))
        self.add(moving_dot, v_line, h_line)

        self.play(x_tracker.animate.set_value(c_val + delta - 0.05), run_time=3)
        self.play(x_tracker.animate.set_value(c_val - delta + 0.05), run_time=3)
        self.wait(0.5)

        # Conclusion
        concl = Text("f(x) stays within ε of f(c)", font_size=26, color=YELLOW)
        concl.next_to(axes, UP, buff=0.1).shift(RIGHT*2.5)
        self.play(Write(concl))
        self.wait(2)
